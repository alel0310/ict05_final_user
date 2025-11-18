package com.boot.ict05_final_user.domain.analytics.repository;

import com.boot.ict05_final_user.domain.analytics.dto.*;
import com.boot.ict05_final_user.domain.analytics.dto.AnalyticsSearchDto.ViewBy;
import com.boot.ict05_final_user.domain.menu.entity.QMenu;
import com.boot.ict05_final_user.domain.menu.entity.QMenuCategory;
import com.boot.ict05_final_user.domain.order.entity.*;
import com.boot.ict05_final_user.domain.store.entity.QStore;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.ConstantImpl;
import com.querydsl.core.types.dsl.*;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RequiredArgsConstructor
@Repository
public class AnalyticsRepositoryImpl implements AnalyticsRespositoryCustom {

	private final JPAQueryFactory query;

	private final QCustomerOrder co = QCustomerOrder.customerOrder;
	private final QCustomerOrderDetail cod = QCustomerOrderDetail.customerOrderDetail;
	private final QStore s = QStore.store;
	private final QMenu m = QMenu.menu;
	private final QMenuCategory mc = QMenuCategory.menuCategory;

	// =========================
	//  KPI Summary (카드 4개)
	// =========================
	@Override
	@Transactional(readOnly = true)
	public KpiSummaryDto fetchKpiSummary(Long storeId, LocalDate today) {

		// 기준 시간 (KST 기준 LocalDate 들어온다고 가정)
		LocalDateTime todayStart = today.atStartOfDay();
		LocalDateTime monthStart = today.withDayOfMonth(1).atStartOfDay();

		// 어제 D, 최근7일/이전7일
		LocalDate d = today.minusDays(1);                  // 어제
		LocalDateTime l7Start = d.minusDays(6).atStartOfDay(); // [D-6, D+1)
		LocalDateTime l7EndEx = todayStart;
		LocalDateTime p7Start = d.minusDays(13).atStartOfDay(); // [D-13, D-6)
		LocalDateTime p7EndEx = l7Start;

		// 스캔 범위: MTD와 P7/L7 전체를 모두 포함하도록 min(monthStart, p7Start) ~ todayStart
		LocalDateTime scanStart = monthStart.isBefore(p7Start) ? monthStart : p7Start;

		// 공통 WHERE: 상태 + 점포 + 스캔 범위
		BooleanExpression base = statusCompleted()
				.and(eqStore(storeId))
				.and(betweenClosedOpen(co.orderedAt, scanStart, todayStart));

		// co.totalPrice(BigDecimal) 기반 CASE 합계들
		NumberExpression<BigDecimal> salesMtdExpr = new CaseBuilder()
				.when(betweenClosedOpen(co.orderedAt, monthStart, todayStart))
				.then(co.totalPrice)
				.otherwise(Expressions.constant(BigDecimal.ZERO))
				.sum();

		NumberExpression<Long> txMtdExpr = new CaseBuilder()
				.when(betweenClosedOpen(co.orderedAt, monthStart, todayStart))
				.then(1L).otherwise(0L).sum();

		NumberExpression<BigDecimal> salesL7Expr = new CaseBuilder()
				.when(betweenClosedOpen(co.orderedAt, l7Start, l7EndEx))
				.then(co.totalPrice)
				.otherwise(Expressions.constant(BigDecimal.ZERO))
				.sum();

		NumberExpression<BigDecimal> salesP7Expr = new CaseBuilder()
				.when(betweenClosedOpen(co.orderedAt, p7Start, p7EndEx))
				.then(co.totalPrice)
				.otherwise(Expressions.constant(BigDecimal.ZERO))
				.sum();

		Tuple t = query
				.select(salesMtdExpr, txMtdExpr, salesL7Expr, salesP7Expr)
				.from(co)
				.join(co.store, s)
				.where(base)
				.setHint("org.hibernate.readOnly", true)
				.setHint("org.hibernate.flushMode", "COMMIT")
				.setHint("jakarta.persistence.query.timeout", 3000)
				.fetchOne();

		BigDecimal salesMtdBD = nvlBD(t == null ? null : t.get(salesMtdExpr));
		long txMtd            = nvlLong(t == null ? null : t.get(txMtdExpr));
		BigDecimal salesL7BD  = nvlBD(t == null ? null : t.get(salesL7Expr));
		BigDecimal salesP7BD  = nvlBD(t == null ? null : t.get(salesP7Expr));

		// Units_MTD (상세 테이블 cod 기준 별도 스캔)
		Integer unitsMtdInt = query
				.select(cod.quantity.sum())
				.from(cod)
				.join(co).on(cod.order.id.eq(co.id))
				.join(co.store, s)
				.where(
						statusCompleted(),
						eqStore(storeId),
						betweenClosedOpen(co.orderedAt, monthStart, todayStart)
				)
				.setHint("org.hibernate.readOnly", true)
				.setHint("org.hibernate.flushMode", "COMMIT")
				.setHint("jakarta.persistence.query.timeout", 3000)
				.fetchOne();

		long unitsMtd = (unitsMtdInt == null) ? 0L : unitsMtdInt.longValue();

		// 파생 계산(Java)
		long salesMtd = salesMtdBD.longValue();
		long salesL7  = salesL7BD.longValue();
		long salesP7  = salesP7BD.longValue();

		double upt = safeDiv(unitsMtd, txMtd);         // UPT = units / tx
		long ads   = Math.round(safeDiv(salesMtd, txMtd));   // ADS(객단가)
		long aur   = Math.round(safeDiv(salesMtd, unitsMtd)); // AUR(단가)

		Double wow = (salesP7 == 0L)
				? null
				: round1(((salesL7 - salesP7) * 100.0) / salesP7);

		return new KpiSummaryDto(salesMtd, txMtd, unitsMtd, upt, ads, aur, wow);
	}

	// =========================
	//  KPI Rows (일별/월별, 커서 페이징)
	// =========================
	@Override
	@Transactional(readOnly = true)
	public CursorPage<KpiRowDto> fetchKpiRows(Long storeId, AnalyticsSearchDto cond) {
		boolean byMonth = cond.viewBy() == ViewBy.MONTH;
		int size = (cond.size() == null ? 50 : cond.size());

		// 기간 (열림-닫힘) : [start 00:00, end 00:00)
		LocalDateTime start = cond.startDate().atStartOfDay();
		LocalDateTime endEx = cond.endDate().plusDays(1).atStartOfDay();

		// 공통 WHERE
		BooleanExpression filter = statusCompleted()
				.and(eqStore(storeId))
				.and(betweenClosedOpen(co.orderedAt, start, endEx));

		// 라벨 (일별 or 월별)
		StringExpression dayLabel = Expressions.stringTemplate(
				"DATE_FORMAT({0}, {1})", co.orderedAt, ConstantImpl.create("%Y-%m-%d"));
		StringExpression monthLabel = Expressions.stringTemplate(
				"DATE_FORMAT({0}, {1})", co.orderedAt, ConstantImpl.create("%Y-%m"));
		StringExpression labelExpr = byMonth ? monthLabel : dayLabel;

		// 커서(최근순) - label 문자열 비교 (YYYY-MM[-DD] 포맷이므로 문자열 비교 = 날짜 역순)
		if (cond.cursor() != null && !cond.cursor().isBlank()) {
			filter = filter.and(labelExpr.lt(cond.cursor()));
		}

		// 1) 매출/주문수 기본 집계 (co만 스캔 → 중복 합계 방지)
		NumberExpression<BigDecimal> salesSum = co.totalPrice.sum();     // BigDecimal
		NumberExpression<Long> txCount = co.id.countDistinct();          // Long

		List<Tuple> rows = query
				.select(labelExpr, salesSum, txCount)
				.from(co)
				.join(co.store, s)
				.where(filter)
				.groupBy(labelExpr)
				.orderBy(labelExpr.desc())
				.limit(size + 1) // 다음 커서 유무 확인용으로 +1
				.setHint("org.hibernate.readOnly", true)
				.setHint("org.hibernate.flushMode", "COMMIT")
				.setHint("jakarta.persistence.query.timeout", 3000)
				.fetch();

		List<KpiRowDto> items = new ArrayList<>();
		if (rows.isEmpty()) {
			return new CursorPage<>(items, null);
		}

		boolean hasNext = rows.size() > size;
		List<Tuple> pageRows = hasNext ? rows.subList(0, size) : rows;

		// 현재 페이지 라벨만 추출
		List<String> labels = new ArrayList<>(pageRows.size());
		for (Tuple t : pageRows) {
			labels.add(t.get(labelExpr));
		}

		// 2) 수량(units) 집계: cod 기준, label 기준으로 SUM(quantity)
		Map<String, Long> unitsMap = new HashMap<>();
		if (!labels.isEmpty()) {
			List<Tuple> unitRows = query
					.select(labelExpr, cod.quantity.sum())
					.from(cod)
					.join(cod.order, co)
					.join(co.store, s)
					.where(
							statusCompleted(),
							eqStore(storeId),
							betweenClosedOpen(co.orderedAt, start, endEx),
							labelExpr.in(labels)
					)
					.groupBy(labelExpr)
					.setHint("org.hibernate.readOnly", true)
					.setHint("org.hibernate.flushMode", "COMMIT")
					.setHint("jakarta.persistence.query.timeout", 3000)
					.fetch();

			for (Tuple t : unitRows) {
				String label = t.get(labelExpr);
				Integer unitsInt = t.get(1, Integer.class);
				long units = (unitsInt == null) ? 0L : unitsInt.longValue();
				unitsMap.put(label, units);
			}
		}

		// 3) DTO 변환 + 파생 KPI 계산
		for (Tuple t : pageRows) {
			String label = t.get(labelExpr);
			BigDecimal salesBD = nvlBD(t.get(salesSum));
			long sales = salesBD.longValue();
			long tx = nvlLong(t.get(txCount));
			long units = unitsMap.getOrDefault(label, 0L);

			double upt = safeDiv(units, tx);
			long ads = Math.round(safeDiv(sales, tx));    // 객단가
			long aur = Math.round(safeDiv(sales, units)); // 단가

			items.add(new KpiRowDto(label, sales, tx, upt, ads, aur));
		}

		String nextCursor = null;
		if (hasNext) {
			Tuple last = pageRows.get(pageRows.size() - 1);
			nextCursor = last.get(labelExpr); // YYYY-MM-DD or YYYY-MM
		}

		return new CursorPage<>(items, nextCursor);
	}

	// =========================
	//  주문 분석 Summary (카드 4개)
	// =========================
	@Override
	@Transactional(readOnly = true)
	public OrderSummaryDto fetchOrderSummary(Long storeId, LocalDate today) {

		LocalDateTime todayStart = today.atStartOfDay();
		LocalDateTime monthStart = today.withDayOfMonth(1).atStartOfDay();

		BooleanExpression base = statusCompleted()
				.and(eqStore(storeId))
				.and(betweenClosedOpen(co.orderedAt, monthStart, todayStart)); // 이번달 1일 ~ 어제까지

		NumberExpression<BigDecimal> deliverySalesExpr = new CaseBuilder()
				.when(co.orderType.eq(OrderType.DELIVERY))
				.then(co.totalPrice)
				.otherwise(Expressions.constant(BigDecimal.ZERO))
				.sum();

		NumberExpression<BigDecimal> takeoutSalesExpr = new CaseBuilder()
				.when(co.orderType.eq(OrderType.TAKEOUT))
				.then(co.totalPrice)
				.otherwise(Expressions.constant(BigDecimal.ZERO))
				.sum();

		NumberExpression<BigDecimal> visitSalesExpr = new CaseBuilder()
				.when(co.orderType.eq(OrderType.VISIT))
				.then(co.totalPrice)
				.otherwise(Expressions.constant(BigDecimal.ZERO))
				.sum();

		NumberExpression<Long> orderCountExpr = co.id.countDistinct();

		Tuple t = query
				.select(deliverySalesExpr, takeoutSalesExpr, visitSalesExpr, orderCountExpr)
				.from(co)
				.join(co.store, s)
				.where(base)
				.setHint("org.hibernate.readOnly", true)
				.setHint("org.hibernate.flushMode", "COMMIT")
				.setHint("jakarta.persistence.query.timeout", 3000)
				.fetchOne();

		BigDecimal deliveryBD = nvlBD(t == null ? null : t.get(deliverySalesExpr));
		BigDecimal takeoutBD  = nvlBD(t == null ? null : t.get(takeoutSalesExpr));
		BigDecimal visitBD    = nvlBD(t == null ? null : t.get(visitSalesExpr));
		long orderCount       = nvlLong(t == null ? null : t.get(orderCountExpr));

		return new OrderSummaryDto(
				deliveryBD.longValue(),
				takeoutBD.longValue(),
				visitBD.longValue(),
				orderCount
		);
	}

	// =========================
	//  주문 분석 일별 테이블(주문 단위)
	// =========================
	@Override
	@Transactional(readOnly = true)
	public CursorPage<OrderDailyRowDto> fetchOrderDailyRows(Long storeId, AnalyticsSearchDto cond) {
		int size = (cond.size() == null ? 50 : cond.size());

		// [start 00:00, end+1 00:00)
		LocalDateTime start = cond.startDate().atStartOfDay();
		LocalDateTime endEx = cond.endDate().plusDays(1).atStartOfDay();

		BooleanExpression filter = statusCompleted()
				.and(eqStore(storeId))
				.and(betweenClosedOpen(co.orderedAt, start, endEx));

		// 🔹 커서: "마지막 주문 ID" 기준으로만 사용
		if (cond.cursor() != null && !cond.cursor().isBlank()) {
			try {
				Long lastId = Long.valueOf(cond.cursor());
				filter = filter.and(co.id.lt(lastId));
			} catch (NumberFormatException ignore) {
				// 잘못된 커서 값이면 그냥 무시하고 처음 페이지처럼 동작
			}
		}

		// 🔹 메뉴 수량 합계 (상세 테이블 기준)
		NumberExpression<Integer> menuCountExpr = cod.quantity.sum();

		List<Tuple> rows = query
				.select(
						co.orderedAt,
						co.id,
						co.orderCode,
						co.orderType,
						co.totalPrice,
						menuCountExpr,
						co.paymentType,
						co.memo
				)
				.from(co)
				.join(co.store, s)
				// ⭐ 여기 추가: 주문 ↔ 주문상세 조인 (LEFT JOIN)
				.leftJoin(cod).on(cod.order.id.eq(co.id))
				.where(filter)
				.groupBy(
						co.orderedAt,
						co.id,
						co.orderCode,
						co.orderType,
						co.totalPrice,
						co.paymentType,
						co.memo
				)
				// 🔹 화면 정렬: 날짜 내림차순 + 같은 날은 ID 내림차순
				.orderBy(co.orderedAt.desc(), co.id.desc())
				.limit(size + 1)
				.setHint("org.hibernate.readOnly", true)
				.setHint("org.hibernate.flushMode", "COMMIT")
				.setHint("jakarta.persistence.query.timeout", 3000)
				.fetch();

		List<OrderDailyRowDto> items = new ArrayList<>();
		List<Tuple> pageRows = rows.size() > size ? rows.subList(0, size) : rows;

		for (Tuple t : pageRows) {
			LocalDateTime orderedAt = t.get(co.orderedAt);
			Long orderId            = t.get(co.id);
			String orderCode        = t.get(co.orderCode);
			OrderType orderType     = t.get(co.orderType);
			BigDecimal totalPriceBD = nvlBD(t.get(co.totalPrice));
			Integer menuCountInt    = t.get(menuCountExpr);
			PaymentType payType     = t.get(co.paymentType);
			String memo             = t.get(co.memo);

			String orderDate = orderedAt.toLocalDate().toString();
			long totalPrice  = totalPriceBD.longValue();
			long menuCount   = menuCountInt == null ? 0L : menuCountInt.longValue();

			items.add(new OrderDailyRowDto(
					orderDate,
					orderId,
					orderCode,
					orderType != null ? orderType.name() : null,
					totalPrice,
					menuCount,
					payType != null ? payType.name() : null,
					memo
			));
		}

		String nextCursor = null;
		if (rows.size() > size) {
			Tuple last = rows.get(size - 1);
			Long lastId = last.get(co.id);
			if (lastId != null) {
				nextCursor = String.valueOf(lastId); // 🔹 커서 = 마지막 주문 ID
			}
		}

		return new CursorPage<>(items, nextCursor);
	}



	// =========================
	//  주문 분석 월별 테이블(월 단위 집계)
	// =========================
	@Override
	@Transactional(readOnly = true)
	public CursorPage<OrderMonthlyRowDto> fetchOrderMonthlyRows(Long storeId, AnalyticsSearchDto cond) {
		int size = (cond.size() == null ? 50 : cond.size());

		LocalDateTime start = cond.startDate().atStartOfDay();
		LocalDateTime endEx = cond.endDate().plusDays(1).atStartOfDay();

		BooleanExpression filter = statusCompleted()
				.and(eqStore(storeId))
				.and(betweenClosedOpen(co.orderedAt, start, endEx));

		StringExpression monthLabel = Expressions.stringTemplate(
				"DATE_FORMAT({0}, {1})", co.orderedAt, ConstantImpl.create("%Y-%m"));

		// 커서: 최근 월 기준 (YYYY-MM) 내려가기
		if (cond.cursor() != null && !cond.cursor().isBlank()) {
			filter = filter.and(monthLabel.lt(cond.cursor()));
		}

		NumberExpression<BigDecimal> totalSalesExpr = co.totalPrice.sum();
		NumberExpression<Long>       orderCountExpr = co.id.countDistinct();

		NumberExpression<BigDecimal> deliverySalesExpr = new CaseBuilder()
				.when(co.orderType.eq(OrderType.DELIVERY))
				.then(co.totalPrice)
				.otherwise(Expressions.constant(BigDecimal.ZERO))
				.sum();

		NumberExpression<BigDecimal> takeoutSalesExpr = new CaseBuilder()
				.when(co.orderType.eq(OrderType.TAKEOUT))
				.then(co.totalPrice)
				.otherwise(Expressions.constant(BigDecimal.ZERO))
				.sum();

		NumberExpression<BigDecimal> visitSalesExpr = new CaseBuilder()
				.when(co.orderType.eq(OrderType.VISIT))
				.then(co.totalPrice)
				.otherwise(Expressions.constant(BigDecimal.ZERO))
				.sum();

		List<Tuple> rows = query
				.select(
						monthLabel,
						totalSalesExpr,
						orderCountExpr,
						deliverySalesExpr,
						takeoutSalesExpr,
						visitSalesExpr
				)
				.from(co)
				.join(co.store, s)
				.where(filter)
				.groupBy(monthLabel)
				.orderBy(monthLabel.desc())
				.limit(size + 1)
				.setHint("org.hibernate.readOnly", true)
				.setHint("org.hibernate.flushMode", "COMMIT")
				.setHint("jakarta.persistence.query.timeout", 3000)
				.fetch();

		List<OrderMonthlyRowDto> items = new ArrayList<>();
		List<Tuple> pageRows = rows.size() > size ? rows.subList(0, size) : rows;

		for (Tuple t : pageRows) {
			String ym = t.get(monthLabel);

			BigDecimal totalSalesBD = nvlBD(t.get(totalSalesExpr));
			long totalSales         = totalSalesBD.longValue();
			long orderCount         = nvlLong(t.get(orderCountExpr));

			BigDecimal deliveryBD = nvlBD(t.get(deliverySalesExpr));
			BigDecimal takeoutBD  = nvlBD(t.get(takeoutSalesExpr));
			BigDecimal visitBD    = nvlBD(t.get(visitSalesExpr));

			long delivery = deliveryBD.longValue();
			long takeout  = takeoutBD.longValue();
			long visit    = visitBD.longValue();

			long avgOrderAmount = Math.round(safeDiv(totalSales, orderCount));

			items.add(new OrderMonthlyRowDto(
					ym,
					totalSales,
					orderCount,
					avgOrderAmount,
					delivery,
					takeout,
					visit
			));
		}

		String nextCursor = null;
		if (rows.size() > size) {
			Tuple last = rows.get(size - 1);
			String lastYm = last.get(monthLabel);
			nextCursor = lastYm;
		}

		return new CursorPage<>(items, nextCursor);
	}


	// ============================================================
	//                      ★ 메뉴 분석 (신규) ★
	// ============================================================

	// ============================================================================
	//                            ★ 메뉴 분석 Summary ★
	// ============================================================================
	@Override
	@Transactional(readOnly = true)
	public MenuSummaryDto fetchMenuSummary(Long storeId, LocalDate today) {

		LocalDateTime todayStart = today.atStartOfDay();
		LocalDateTime monthStart = today.withDayOfMonth(1).atStartOfDay();

		// MTD: 이번 달 1일 00:00 ~ 오늘 00:00 (어제까지)
		BooleanExpression base = statusCompleted()
				.and(eqStore(storeId))
				.and(betweenClosedOpen(co.orderedAt, monthStart, todayStart));

		// -------- 0) 공통: 메뉴별 수량/매출 집계 --------
		NumberExpression<Integer> qtySumExpr = cod.quantity.sum();
		NumberExpression<BigDecimal> salesSumExpr = cod.lineTotal.sum();

		List<Tuple> menuRows = query
				.select(
						m.menuId,
						m.menuName,
						qtySumExpr,
						salesSumExpr
				)
				.from(cod)
				.join(cod.order, co)
				.join(co.store, s)
				.join(cod.menuIdFk, m)
				.where(base)
				.groupBy(m.menuId, m.menuName)
				.fetch();

		// 전체 메뉴 매출 합계 (매출 기여도 계산용)
		BigDecimal totalSalesBD = BigDecimal.ZERO;
		for (Tuple t : menuRows) {
			totalSalesBD = totalSalesBD.add(nvlBD(t.get(salesSumExpr)));
		}
		long totalSalesAll = totalSalesBD.longValue();

		// 공통 Comparator
		Comparator<Tuple> byQtyDesc = Comparator.comparingLong((Tuple t) -> {
			Integer q = t.get(qtySumExpr);
			return q == null ? 0L : q.longValue();
		}).reversed();

		Comparator<Tuple> bySalesDesc = Comparator.comparingLong((Tuple t) -> {
			BigDecimal s = nvlBD(t.get(salesSumExpr));
			return s.longValue();
		}).reversed();

		Comparator<Tuple> bySalesAsc = Comparator.comparingLong((Tuple t) -> {
			BigDecimal s = nvlBD(t.get(salesSumExpr));
			return s.longValue();
		});

		// -------- 1) 판매수량 Top3 메뉴 --------
		List<MenuTopMenuDto> topMenusByQty = menuRows.stream()
				.sorted(byQtyDesc)
				.limit(3)
				.map(t -> {
					Integer qtyInt = t.get(qtySumExpr);
					long qty = (qtyInt == null) ? 0L : qtyInt.longValue();
					return new MenuTopMenuDto(
							t.get(m.menuId),
							t.get(m.menuName),
							qty
					);
				})
				.toList();

		// -------- 2) 매출 Top3 카테고리 --------
		NumberExpression<BigDecimal> catSalesExpr = cod.lineTotal.sum();

		List<Tuple> catRows = query
				.select(
						mc.menuCategoryId,
						mc.menuCategoryName,
						catSalesExpr
				)
				.from(cod)
				.join(cod.order, co)
				.join(co.store, s)
				.join(cod.menuIdFk, m)
				.join(m.menuCategory, mc)
				.where(base)
				.groupBy(mc.menuCategoryId, mc.menuCategoryName)
				.orderBy(catSalesExpr.desc())
				.limit(3)
				.fetch();

		List<MenuCategoryRankDto> topCategoriesBySales = catRows.stream()
				.map(t -> {
					BigDecimal salesBD = nvlBD(t.get(catSalesExpr));
					return new MenuCategoryRankDto(
							t.get(mc.menuCategoryId),
							t.get(mc.menuCategoryName),
							salesBD.longValue()
					);
				})
				.toList();

		// -------- 3) 매출 기여도 Top3 메뉴 --------
		List<MenuSalesContributionDto> topMenusBySalesContribution = menuRows.stream()
				.sorted(bySalesDesc)
				.limit(3)
				.map(t -> {
					BigDecimal salesBD = nvlBD(t.get(salesSumExpr));
					long sales = salesBD.longValue();
					double share = (totalSalesAll == 0L)
							? 0.0
							: round1((sales * 100.0) / totalSalesAll); // 소수점 1자리

					return new MenuSalesContributionDto(
							t.get(m.menuId),
							t.get(m.menuName),
							sales,
							share
					);
				})
				.toList();

		// -------- 4) 저성과 Top 메뉴 (매출 하위 3개) --------
		List<MenuLowPerformanceDto> lowPerformMenus = menuRows.stream()
				.sorted(bySalesAsc) // 매출 오름차순
				.limit(3)
				.map(t -> {
					Integer qtyInt = t.get(qtySumExpr);
					long qty = (qtyInt == null) ? 0L : qtyInt.longValue();
					BigDecimal salesBD = nvlBD(t.get(salesSumExpr));
					long sales = salesBD.longValue();

					return new MenuLowPerformanceDto(
							t.get(m.menuId),
							t.get(m.menuName),
							qty,
							sales
					);
				})
				.toList();

		return new MenuSummaryDto(
				topMenusByQty,
				topCategoriesBySales,
				topMenusBySalesContribution,
				lowPerformMenus
		);
	}

	// ============================================================================
	//                         ★ 메뉴 분석 일별 테이블 ★
	// ============================================================================
	@Override
	@Transactional(readOnly = true)
	public CursorPage<MenuDailyRowDto> fetchMenuDailyRows(Long storeId, AnalyticsSearchDto cond) {

		LocalDateTime startDT = cond.startDate().atStartOfDay();
		LocalDateTime endExDT = cond.endDate().plusDays(1).atStartOfDay();

		BooleanExpression base = statusCompleted()
				.and(eqStore(storeId))
				.and(betweenClosedOpen(co.orderedAt, startDT, endExDT));

		StringTemplate dayLabel = Expressions.stringTemplate(
				"DATE_FORMAT({0}, '%Y-%m-%d')", co.orderedAt
		);

		NumberExpression<Integer>   qtySumExpr   = cod.quantity.sum();
		NumberExpression<BigDecimal> salesSumExpr = cod.lineTotal.sum();
		NumberExpression<Long>       orderCntExpr = co.id.countDistinct();

		// ----- 커서 처리 -----
		BooleanExpression cursorFilter = null;
		if (cond.cursor() != null && cond.cursor().contains("|")) {
			String[] arr = cond.cursor().split("\\|");
			String cDate = arr[0];
			Long cMenuId = Long.valueOf(arr[1]);

			cursorFilter = dayLabel.lt(cDate)
					.or(dayLabel.eq(cDate).and(m.menuId.lt(cMenuId)));
		}

		// ----- 쿼리 -----
		List<Tuple> rows = query
				.select(
						dayLabel,
						mc.menuCategoryName,
						m.menuName,
						qtySumExpr,
						salesSumExpr,
						orderCntExpr,
						m.menuId
				)
				.from(cod)
				.join(cod.order, co)
				.join(co.store, s)
				.join(cod.menuIdFk, m)
				.join(m.menuCategory, mc)
				.where(base, cursorFilter)
				.groupBy(dayLabel, m.menuId, m.menuName, mc.menuCategoryName)
				.orderBy(
						dayLabel.desc(),
						salesSumExpr.desc(),
						m.menuId.desc()
				)
				.limit(cond.size() + 1)
				.fetch();

		List<MenuDailyRowDto> result = new ArrayList<>();
		String nextCursor = null;

		for (Tuple t : rows) {
			if (result.size() == cond.size()) {
				String d = t.get(dayLabel);
				Long mid = t.get(m.menuId);
				nextCursor = d + "|" + mid;
				break;
			}

			Integer qtyInt       = t.get(qtySumExpr);
			BigDecimal salesBD   = nvlBD(t.get(salesSumExpr));
			Long orderCntLong    = nvlLong(t.get(orderCntExpr));

			result.add(new MenuDailyRowDto(
					t.get(dayLabel),
					t.get(mc.menuCategoryName),
					t.get(m.menuName),
					qtyInt == null ? 0L : qtyInt.longValue(),
					salesBD.longValue(),
					orderCntLong
			));
		}

		return new CursorPage<>(result, nextCursor);
	}


	// ============================================================================
	//                         ★ 메뉴 분석 월별 테이블 ★
	// ============================================================================
	@Override
	@Transactional(readOnly = true)
	public CursorPage<MenuMonthlyRowDto> fetchMenuMonthlyRows(Long storeId, AnalyticsSearchDto cond) {

		int size = (cond.size() == null ? 50 : cond.size());

		LocalDateTime startDT = cond.startDate().atStartOfDay();
		LocalDateTime endExDT = cond.endDate().plusDays(1).atStartOfDay();

		BooleanExpression base = statusCompleted()
				.and(eqStore(storeId))
				.and(betweenClosedOpen(co.orderedAt, startDT, endExDT));

		// YYYY-MM 라벨
		StringTemplate ymLabel = Expressions.stringTemplate(
				"DATE_FORMAT({0}, '%Y-%m')", co.orderedAt
		);

		// 집계식
		NumberExpression<Integer>    qtySumExpr   = cod.quantity.sum();
		NumberExpression<BigDecimal> salesSumExpr = cod.lineTotal.sum();
		NumberExpression<Long>       orderCntExpr = co.id.countDistinct();

		// ----- 커서 처리: "YYYY-MM|menuId" 형식 -----
		BooleanExpression cursorFilter = null;
		String cursor = cond.cursor();

		if (cursor != null && !cursor.isBlank()) {
			try {
				String[] parts = cursor.split("\\|");
				if (parts.length == 2) {
					String cYm     = parts[0];                 // ex) 2025-09
					long   cMenuId = Long.parseLong(parts[1]); // ex) 144

					// 정렬: ym DESC, sales DESC, menuId DESC
					// WHERE 에서는 ym + menuId만으로 "이후 페이지" 판단
					cursorFilter =
							ymLabel.lt(cYm)
									.or(
											ymLabel.eq(cYm)
													.and(m.menuId.lt(cMenuId))
									);
				}
			} catch (Exception ignore) {
				// 잘못된 커서 값이면 무시하고 첫 페이지처럼 동작
				cursorFilter = null;
			}
		}

		// ----- 쿼리 -----
		List<Tuple> rows = query
				.select(
						ymLabel,
						m.menuName,
						mc.menuCategoryName,
						qtySumExpr,
						salesSumExpr,
						orderCntExpr,
						m.menuId
				)
				.from(cod)
				.join(cod.order, co)
				.join(co.store, s)
				.join(cod.menuIdFk, m)
				.join(m.menuCategory, mc)
				.where(base, cursorFilter)
				.groupBy(ymLabel, m.menuId, m.menuName, mc.menuCategoryName)
				.orderBy(
						ymLabel.desc(),
						salesSumExpr.desc(),
						m.menuId.desc()
				)
				.limit(size + 1)
				.setHint("org.hibernate.readOnly", true)
				.setHint("org.hibernate.flushMode", "COMMIT")
				.setHint("jakarta.persistence.query.timeout", 3000)
				.fetch();

		List<MenuMonthlyRowDto> result = new ArrayList<>();
		String nextCursor = null;

		boolean hasNext = rows.size() > size;
		List<Tuple> pageRows = hasNext ? rows.subList(0, size) : rows;

		for (Tuple t : pageRows) {
			String ym = t.get(ymLabel);

			Integer qtyInt       = t.get(qtySumExpr);
			BigDecimal salesBD   = nvlBD(t.get(salesSumExpr));
			Long orderCntLong    = nvlLong(t.get(orderCntExpr));

			long qty    = (qtyInt == null) ? 0L : qtyInt.longValue();
			long sales  = salesBD.longValue();
			long orders = orderCntLong;

			result.add(new MenuMonthlyRowDto(
					ym,
					t.get(m.menuName),
					t.get(mc.menuCategoryName),
					qty,
					sales,
					orders
			));
		}

		// ----- nextCursor 생성 -----
		if (hasNext && !pageRows.isEmpty()) {
			Tuple last      = pageRows.get(pageRows.size() - 1);
			String ymLast   = last.get(ymLabel);
			Long menuIdLast = last.get(m.menuId);

			// "YYYY-MM|menuId"
			nextCursor = ymLast + "|" + menuIdLast;
		}

		return new CursorPage<>(result, nextCursor);
	}


	// ============================================================
	//                      ★ 시간/요일 분석 (신규) ★
	// ============================================================

	private NumberExpression<Integer> hourOfDay() {
		return Expressions.numberTemplate(Integer.class, "HOUR({0})", co.orderedAt);
	}

	/**
	 * 요일: 1~7, 월=1, …, 일=7 로 변환.
	 * DAYOFWEEK() 결과(1=일, 7=토)를 보정.
	 */
	private NumberExpression<Integer> weekDayKorean() {
		return Expressions.numberTemplate(
				Integer.class,
				"((DAYOFWEEK({0}) + 5) % 7) + 1",
				co.orderedAt
		);
	}

	private BooleanExpression businessHoursFilter(NumberExpression<Integer> hourExpr) {
		return hourExpr.goe(7).and(hourExpr.loe(20));
	}

	// =========================
	//  시간/요일 요약 카드
	// =========================
	@Override
	@Transactional(readOnly = true)
	public TimeDaySummaryDto fetchTimeDaySummary(Long storeId, LocalDate today) {

		// 이번달 1일
		LocalDate mtdStart = today.withDayOfMonth(1);
		// 어제
		LocalDate mtdEnd = today.minusDays(1);

		// 만약 오늘이 1일이면 mtdEnd < mtdStart -> where 조건은 그대로지만 결과 0건 → 전부 0/ null 처리
		LocalDateTime startDT = mtdStart.atStartOfDay();
		LocalDateTime endExDT = today.atStartOfDay(); // 어제 24:00 == 오늘 00:00

		BooleanExpression base = statusCompleted()
				.and(eqStore(storeId))
				.and(betweenClosedOpen(co.orderedAt, startDT, endExDT));

		NumberExpression<Integer> hourExpr = hourOfDay();
		NumberExpression<Integer> weekdayExpr = weekDayKorean();
		BooleanExpression bizHours = businessHoursFilter(hourExpr);

		NumberExpression<BigDecimal> salesSumExpr = co.totalPrice.sum();

		// ---- 1) 시간대별 매출 ----
		List<Tuple> hourlyRows = query
				.select(hourExpr, salesSumExpr)
				.from(co)
				.join(co.store, s)
				.where(base, bizHours)
				.groupBy(hourExpr)
				.setHint("org.hibernate.readOnly", true)
				.setHint("org.hibernate.flushMode", "COMMIT")
				.setHint("jakarta.persistence.query.timeout", 3000)
				.fetch();

		Integer peakHour = null;
		long peakSales = 0L;
		Integer offHour = null;
		long offSales = 0L;

		for (Tuple t : hourlyRows) {
			Integer h = t.get(hourExpr);
			if (h == null) continue;
			BigDecimal salesBD = nvlBD(t.get(salesSumExpr));
			long sales = salesBD.longValue();

			// 피크 (최대 매출)
			if (sales > peakSales) {
				peakSales = sales;
				peakHour = h;
			}
			// 비수 (매출>0 중 최소)
			if (sales > 0L) {
				if (offHour == null || sales < offSales) {
					offSales = sales;
					offHour = h;
				}
			}
		}

		// ---- 2) 요일별 매출 + 주중/주말 ----
		List<Tuple> weekdayRows = query
				.select(weekdayExpr, salesSumExpr)
				.from(co)
				.join(co.store, s)
				.where(base, bizHours)
				.groupBy(weekdayExpr)
				.setHint("org.hibernate.readOnly", true)
				.setHint("org.hibernate.flushMode", "COMMIT")
				.setHint("jakarta.persistence.query.timeout", 3000)
				.fetch();

		Integer topWeekday = null;
		long topWeekdaySales = 0L;
		long weekdaySales = 0L;
		long weekendSales = 0L;

		for (Tuple t : weekdayRows) {
			Integer wd = t.get(weekdayExpr);
			if (wd == null) continue;
			BigDecimal salesBD = nvlBD(t.get(salesSumExpr));
			long sales = salesBD.longValue();

			// 최고 매출 요일
			if (sales > topWeekdaySales) {
				topWeekdaySales = sales;
				topWeekday = wd;
			}

			// 주중(월~금=1~5) / 주말(토,일=6,7)
			if (wd == 6 || wd == 7) {
				weekendSales += sales;
			} else {
				weekdaySales += sales;
			}
		}

		return new TimeDaySummaryDto(
				peakHour,
				peakSales,
				offHour,
				offSales,
				topWeekday,
				topWeekdaySales,
				weekdaySales,
				weekendSales
		);
	}


	// =========================
	//  시간대별 차트
	// =========================
	@Override
	@Transactional(readOnly = true)
	public List<TimeHourlyPointDto> fetchTimeHourlyChart(Long storeId, LocalDate startDate, LocalDate endDate) {

		LocalDateTime startDT = startDate.atStartOfDay();
		LocalDateTime endExDT = endDate.plusDays(1).atStartOfDay();

		BooleanExpression base = statusCompleted()
				.and(eqStore(storeId))
				.and(betweenClosedOpen(co.orderedAt, startDT, endExDT));

		NumberExpression<Integer> hourExpr = hourOfDay();
		BooleanExpression bizHours = businessHoursFilter(hourExpr);

		NumberExpression<BigDecimal> salesSumExpr = co.totalPrice.sum();
		NumberExpression<Long> orderCountExpr = co.id.countDistinct();

		NumberExpression<Long> visitCountExpr = new CaseBuilder()
				.when(co.orderType.eq(OrderType.VISIT))
				.then(1L).otherwise(0L).sum();

		NumberExpression<Long> takeoutCountExpr = new CaseBuilder()
				.when(co.orderType.eq(OrderType.TAKEOUT))
				.then(1L).otherwise(0L).sum();

		NumberExpression<Long> deliveryCountExpr = new CaseBuilder()
				.when(co.orderType.eq(OrderType.DELIVERY))
				.then(1L).otherwise(0L).sum();

		List<Tuple> rows = query
				.select(
						hourExpr,
						salesSumExpr,
						orderCountExpr,
						visitCountExpr,
						takeoutCountExpr,
						deliveryCountExpr
				)
				.from(co)
				.join(co.store, s)
				.where(base, bizHours)
				.groupBy(hourExpr)
				.orderBy(hourExpr.asc())
				.setHint("org.hibernate.readOnly", true)
				.setHint("org.hibernate.flushMode", "COMMIT")
				.setHint("jakarta.persistence.query.timeout", 3000)
				.fetch();

		Map<Integer, TimeHourlyPointDto> map = new HashMap<>();
		for (Tuple t : rows) {
			Integer h = t.get(hourExpr);
			if (h == null) continue;

			BigDecimal salesBD = nvlBD(t.get(salesSumExpr));
			long sales = salesBD.longValue();
			long orders = nvlLong(t.get(orderCountExpr));
			long visit = nvlLong(t.get(visitCountExpr));
			long takeout = nvlLong(t.get(takeoutCountExpr));
			long delivery = nvlLong(t.get(deliveryCountExpr));

			map.put(h, new TimeHourlyPointDto(h, sales, orders, visit, takeout, delivery));
		}

		// 07~20 모든 시간대를 채우되, 없는 시간대는 0으로 채움
		List<TimeHourlyPointDto> result = new ArrayList<>();
		for (int h = 7; h <= 20; h++) {
			TimeHourlyPointDto p = map.get(h);
			if (p == null) {
				p = new TimeHourlyPointDto(h, 0L, 0L, 0L, 0L, 0L);
			}
			result.add(p);
		}
		return result;
	}

	// =========================
	//  요일별 차트
	// =========================
	@Override
	@Transactional(readOnly = true)
	public List<WeekdaySalesPointDto> fetchWeekdayChart(Long storeId, LocalDate startDate, LocalDate endDate) {

		LocalDateTime startDT = startDate.atStartOfDay();
		LocalDateTime endExDT = endDate.plusDays(1).atStartOfDay();

		BooleanExpression base = statusCompleted()
				.and(eqStore(storeId))
				.and(betweenClosedOpen(co.orderedAt, startDT, endExDT));

		NumberExpression<Integer> weekdayExpr = weekDayKorean();
		NumberExpression<Integer> hourExpr = hourOfDay();
		BooleanExpression bizHours = businessHoursFilter(hourExpr);

		NumberExpression<BigDecimal> salesSumExpr = co.totalPrice.sum();
		NumberExpression<Long> orderCountExpr = co.id.countDistinct();

		List<Tuple> rows = query
				.select(weekdayExpr, salesSumExpr, orderCountExpr)
				.from(co)
				.join(co.store, s)
				.where(base, bizHours)
				.groupBy(weekdayExpr)
				.orderBy(weekdayExpr.asc())
				.setHint("org.hibernate.readOnly", true)
				.setHint("org.hibernate.flushMode", "COMMIT")
				.setHint("jakarta.persistence.query.timeout", 3000)
				.fetch();

		Map<Integer, WeekdaySalesPointDto> map = new HashMap<>();
		for (Tuple t : rows) {
			Integer wd = t.get(weekdayExpr);
			if (wd == null) continue;
			BigDecimal salesBD = nvlBD(t.get(salesSumExpr));
			long sales = salesBD.longValue();
			long orders = nvlLong(t.get(orderCountExpr));
			map.put(wd, new WeekdaySalesPointDto(wd, sales, orders));
		}

		List<WeekdaySalesPointDto> result = new ArrayList<>();
		for (int wd = 1; wd <= 7; wd++) {
			WeekdaySalesPointDto p = map.get(wd);
			if (p == null) {
				p = new WeekdaySalesPointDto(wd, 0L, 0L);
			}
			result.add(p);
		}
		return result;
	}

	// =========================
	//  일별 테이블 (날짜+요일+시간대)
	// =========================
	@Override
	@Transactional(readOnly = true)
	public CursorPage<TimeDayDailyRowDto> fetchTimeDayDailyRows(Long storeId, AnalyticsSearchDto cond) {

		int size = (cond.size() == null ? 50 : cond.size());

		LocalDateTime startDT = cond.startDate().atStartOfDay();
		LocalDateTime endExDT = cond.endDate().plusDays(1).atStartOfDay();

		BooleanExpression base = statusCompleted()
				.and(eqStore(storeId))
				.and(betweenClosedOpen(co.orderedAt, startDT, endExDT));

		NumberExpression<Integer> hourExpr = hourOfDay();
		NumberExpression<Integer> weekdayExpr = weekDayKorean();
		BooleanExpression bizHours = businessHoursFilter(hourExpr);

		StringTemplate dayLabel = Expressions.stringTemplate(
				"DATE_FORMAT({0}, '%Y-%m-%d')", co.orderedAt
		);

		NumberExpression<BigDecimal> salesSumExpr = co.totalPrice.sum();
		NumberExpression<Long> orderCntExpr = co.id.countDistinct();

		NumberExpression<Long> visitCntExpr = new CaseBuilder()
				.when(co.orderType.eq(OrderType.VISIT))
				.then(1L).otherwise(0L).sum();

		NumberExpression<Long> takeoutCntExpr = new CaseBuilder()
				.when(co.orderType.eq(OrderType.TAKEOUT))
				.then(1L).otherwise(0L).sum();

		NumberExpression<Long> deliveryCntExpr = new CaseBuilder()
				.when(co.orderType.eq(OrderType.DELIVERY))
				.then(1L).otherwise(0L).sum();

		// 커서: "YYYY-MM-DD|HH"
		BooleanExpression cursorFilter = null;
		String cursor = cond.cursor();
		if (cursor != null && cursor.contains("|")) {
			try {
				String[] parts = cursor.split("\\|");
				String cDate = parts[0];
				int cHour = Integer.parseInt(parts[1]);

				cursorFilter = dayLabel.lt(cDate)
						.or(
								dayLabel.eq(cDate)
										.and(hourExpr.gt(cHour))
						);
			} catch (Exception ignore) {
				cursorFilter = null;
			}
		}

		List<Tuple> rows = query
				.select(
						dayLabel,
						weekdayExpr,
						hourExpr,
						salesSumExpr,
						orderCntExpr,
						visitCntExpr,
						takeoutCntExpr,
						deliveryCntExpr
				)
				.from(co)
				.join(co.store, s)
				.where(base, bizHours, cursorFilter)
				.groupBy(dayLabel, weekdayExpr, hourExpr)
				.orderBy(dayLabel.desc(), hourExpr.asc())
				.limit(size + 1)
				.setHint("org.hibernate.readOnly", true)
				.setHint("org.hibernate.flushMode", "COMMIT")
				.setHint("jakarta.persistence.query.timeout", 3000)
				.fetch();

		List<TimeDayDailyRowDto> result = new ArrayList<>();
		String nextCursor = null;

		for (Tuple t : rows) {
			if (result.size() == size) {
				String d = t.get(dayLabel);
				Integer h = t.get(hourExpr);
				if (d != null && h != null) {
					nextCursor = d + "|" + h;
				}
				break;
			}

			String d = t.get(dayLabel);
			Integer wd = t.get(weekdayExpr);
			Integer h = t.get(hourExpr);

			BigDecimal salesBD = nvlBD(t.get(salesSumExpr));
			long sales = salesBD.longValue();
			long orderCnt = nvlLong(t.get(orderCntExpr));
			long visit = nvlLong(t.get(visitCntExpr));
			long takeout = nvlLong(t.get(takeoutCntExpr));
			long delivery = nvlLong(t.get(deliveryCntExpr));

			double visitRate = safeDiv(visit, orderCnt);
			double takeoutRate = safeDiv(takeout, orderCnt);
			double deliveryRate = safeDiv(delivery, orderCnt);

			result.add(new TimeDayDailyRowDto(
					d,
					wd == null ? 0 : wd,
					h == null ? 0 : h,
					orderCnt,
					sales,
					visit,
					takeout,
					delivery,
					visitRate,
					takeoutRate,
					deliveryRate
			));
		}

		return new CursorPage<>(result, nextCursor);
	}

	// =========================
	//  월별 테이블 (월+요일+시간대)
	// =========================
	@Override
	@Transactional(readOnly = true)
	public CursorPage<TimeDayMonthlyRowDto> fetchTimeDayMonthlyRows(Long storeId, AnalyticsSearchDto cond) {

		int size = (cond.size() == null ? 50 : cond.size());

		LocalDateTime startDT = cond.startDate().atStartOfDay();
		LocalDateTime endExDT = cond.endDate().plusDays(1).atStartOfDay();

		BooleanExpression base = statusCompleted()
				.and(eqStore(storeId))
				.and(betweenClosedOpen(co.orderedAt, startDT, endExDT));

		NumberExpression<Integer> hourExpr = hourOfDay();
		NumberExpression<Integer> weekdayExpr = weekDayKorean();
		BooleanExpression bizHours = businessHoursFilter(hourExpr);

		StringTemplate ymLabel = Expressions.stringTemplate(
				"DATE_FORMAT({0}, '%Y-%m')", co.orderedAt
		);

		NumberExpression<BigDecimal> salesSumExpr = co.totalPrice.sum();
		NumberExpression<Long> orderCntExpr = co.id.countDistinct();

		NumberExpression<Long> visitCntExpr = new CaseBuilder()
				.when(co.orderType.eq(OrderType.VISIT))
				.then(1L).otherwise(0L).sum();

		NumberExpression<Long> takeoutCntExpr = new CaseBuilder()
				.when(co.orderType.eq(OrderType.TAKEOUT))
				.then(1L).otherwise(0L).sum();

		NumberExpression<Long> deliveryCntExpr = new CaseBuilder()
				.when(co.orderType.eq(OrderType.DELIVERY))
				.then(1L).otherwise(0L).sum();

		// 커서: "YYYY-MM|weekday|hour"
		BooleanExpression cursorFilter = null;
		String cursor = cond.cursor();
		if (cursor != null && !cursor.isBlank() && cursor.contains("|")) {
			try {
				String[] parts = cursor.split("\\|");
				String cYm = parts[0];
				int cWd = Integer.parseInt(parts[1]);
				int cHour = Integer.parseInt(parts[2]);

				BooleanExpression afterSameYm =
						weekdayExpr.gt(cWd)
								.or(
										weekdayExpr.eq(cWd)
												.and(hourExpr.gt(cHour))
								);

				cursorFilter = ymLabel.lt(cYm)
						.or(
								ymLabel.eq(cYm).and(afterSameYm)
						);
			} catch (Exception ignore) {
				cursorFilter = null;
			}
		}

		List<Tuple> rows = query
				.select(
						ymLabel,
						weekdayExpr,
						hourExpr,
						salesSumExpr,
						orderCntExpr,
						visitCntExpr,
						takeoutCntExpr,
						deliveryCntExpr
				)
				.from(co)
				.join(co.store, s)
				.where(base, bizHours, cursorFilter)
				.groupBy(ymLabel, weekdayExpr, hourExpr)
				.orderBy(
						ymLabel.desc(),
						weekdayExpr.asc(),
						hourExpr.asc()
				)
				.limit(size + 1)
				.setHint("org.hibernate.readOnly", true)
				.setHint("org.hibernate.flushMode", "COMMIT")
				.setHint("jakarta.persistence.query.timeout", 3000)
				.fetch();

		List<TimeDayMonthlyRowDto> result = new ArrayList<>();
		String nextCursor = null;

		for (Tuple t : rows) {
			if (result.size() == size) {
				String ym = t.get(ymLabel);
				Integer wd = t.get(weekdayExpr);
				Integer h = t.get(hourExpr);
				if (ym != null && wd != null && h != null) {
					nextCursor = ym + "|" + wd + "|" + h;
				}
				break;
			}

			String ym = t.get(ymLabel);
			Integer wd = t.get(weekdayExpr);
			Integer h = t.get(hourExpr);

			BigDecimal salesBD = nvlBD(t.get(salesSumExpr));
			long sales = salesBD.longValue();
			long orderCnt = nvlLong(t.get(orderCntExpr));
			long visit = nvlLong(t.get(visitCntExpr));
			long takeout = nvlLong(t.get(takeoutCntExpr));
			long delivery = nvlLong(t.get(deliveryCntExpr));

			double visitRate = safeDiv(visit, orderCnt);
			double takeoutRate = safeDiv(takeout, orderCnt);
			double deliveryRate = safeDiv(delivery, orderCnt);

			result.add(new TimeDayMonthlyRowDto(
					ym,
					wd == null ? 0 : wd,
					h == null ? 0 : h,
					orderCnt,
					sales,
					visit,
					takeout,
					delivery,
					visitRate,
					takeoutRate,
					deliveryRate
			));
		}

		return new CursorPage<>(result, nextCursor);
	}





	// ===== Helpers =====
	private static BigDecimal nvlBD(BigDecimal v) {
		return v == null ? BigDecimal.ZERO : v;
	}

	private static long nvlLong(Long v) {
		return v == null ? 0L : v;
	}

	private static double safeDiv(long num, long den) {
		return den == 0L ? 0.0 : (double) num / (double) den;
	}

	private static double round1(double v) {
		return Math.round(v * 10.0) / 10.0;
	}

	private BooleanExpression statusCompleted() {
		return co.status.eq(OrderStatus.COMPLETED);
	}

	private BooleanExpression eqStore(Long storeId) {
		return s.id.eq(storeId);
	}

	/**
	 * 닫힌–열린(>=, <) 기간 필터 (LocalDateTime 기준)
	 */
	private BooleanExpression betweenClosedOpen(DateTimePath<LocalDateTime> col,
												LocalDateTime start, LocalDateTime endEx) {
		return col.goe(start).and(col.lt(endEx));
	}
}
