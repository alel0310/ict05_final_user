package com.boot.ict05_final_user.domain.analytics.repository;

import com.boot.ict05_final_user.domain.analytics.dto.AnalyticsSearchDto;
import com.boot.ict05_final_user.domain.analytics.dto.AnalyticsSearchDto.ViewBy;
import com.boot.ict05_final_user.domain.analytics.dto.CursorPage;
import com.boot.ict05_final_user.domain.analytics.dto.KpiRowDto;
import com.boot.ict05_final_user.domain.analytics.dto.KpiSummaryDto;
import com.boot.ict05_final_user.domain.order.entity.OrderStatus;
import com.boot.ict05_final_user.domain.order.entity.QCustomerOrder;
import com.boot.ict05_final_user.domain.order.entity.QCustomerOrderDetail;
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
		// Enum 매핑(@Enumerated STRING) → 그대로 enum 비교
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
