package com.boot.ict05_final_user.domain.analytics.controller;

import com.boot.ict05_final_user.domain.analytics.dto.*;
import com.boot.ict05_final_user.domain.analytics.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

// import com.boot.ict05_final_user.common.web.StoreScoped; // 실제에선 ArgumentResolver 등 사용

@RestController
@RequiredArgsConstructor
public class AnalyticsRestController {

	private final AnalyticsService service;

	/**
	 * KPI 요약 카드 조회 (로그인 점포 기준, MTD + WoW%)
	 *
	 * - 현재는 임시로 storeId를 쿼리 파라미터로 받음
	 *   (운영 시 @StoreScoped Long storeId 로 교체 예정)
	 */
	@GetMapping("/api/analytics/kpi/summary")
	public ResponseEntity<KpiSummaryDto> getKpiSummary(
			// @StoreScoped Long storeId
			@RequestParam(required = false) Long storeId // 임시 파라미터(로컬 테스트)
	) {
		if (storeId == null) storeId = 1L; // 임시 방어
		return ResponseEntity.ok(service.getKpiSummary(storeId));
	}

	/**
	 * KPI 테이블(일별/월별) 커서 페이징 조회
	 *
	 * @param start  조회 시작일 (YYYY-MM-DD, inclusive)
	 * @param end   조회 종료일 (YYYY-MM-DD, inclusive, 예: 2025-10-01이면 10월 1일 데이터까지 포함)	 * @param viewBy DAY or MONTH
	 * @param size   페이지 크기 (50/100/150/200/300)
	 * @param cursor 커서 (이전 응답의 nextCursor, 없으면 첫 페이지)
	 */
	@GetMapping("/api/analytics/kpi/rows")
	public ResponseEntity<CursorPage<KpiRowDto>> getKpiRows(
			// @StoreScoped Long storeId,
			@RequestParam String start,
			@RequestParam String end,
			@RequestParam(defaultValue = "DAY") AnalyticsSearchDto.ViewBy viewBy,
			@RequestParam(defaultValue = "50") Integer size,
			@RequestParam(required = false) String cursor,
			@RequestParam(required = false) Long storeId // 임시 파라미터 (운영시 @StoreScoped 교체)
	) {
		if (storeId == null) storeId = 1L;
		AnalyticsSearchDto cond = new AnalyticsSearchDto(
				java.time.LocalDate.parse(start),
				java.time.LocalDate.parse(end),
				viewBy, size, cursor
		);
		return ResponseEntity.ok(service.getKpiRows(storeId, cond));
	}


	// ======================
	// 주문 분석 Summary (상단 카드)
	// ======================
	@GetMapping("/api/analytics/orders/summary")
	public ResponseEntity<OrderSummaryDto> getOrderSummary(
			// @StoreScoped Long storeId
			Long storeId // 임시 파라미터(로컬 테스트). 운영 시 @StoreScoped로 교체
	) {
		if (storeId == null) storeId = 1L;
		return ResponseEntity.ok(service.getOrderSummary(storeId));
	}

	// ======================
	// 주문 분석 테이블 - 일별(주문 단위)
	// ======================
	@GetMapping("/api/analytics/orders/day-rows")
	public ResponseEntity<CursorPage<OrderDailyRowDto>> getOrderDailyRows(
			@RequestParam String start,
			@RequestParam String end,                 // 조회 종료일(포함)
			@RequestParam(defaultValue = "50") Integer size,
			@RequestParam(required = false) String cursor,
			Long storeId // 임시 파라미터(운영시 @StoreScoped 교체)
	) {
		if (storeId == null) storeId = 1L;
		AnalyticsSearchDto cond = new AnalyticsSearchDto(
				LocalDate.parse(start),
				LocalDate.parse(end),
				AnalyticsSearchDto.ViewBy.DAY,
				size,
				cursor
		);
		return ResponseEntity.ok(service.getOrderDailyRows(storeId, cond));
	}

	// ======================
	// 주문 분석 테이블 - 월별(월 단위 집계)
	// ======================
	@GetMapping("/api/analytics/orders/month-rows")
	public ResponseEntity<CursorPage<OrderMonthlyRowDto>> getOrderMonthlyRows(
			@RequestParam String start,
			@RequestParam String end,
			@RequestParam(defaultValue = "50") Integer size,
			@RequestParam(required = false) String cursor,
			Long storeId
	) {
		if (storeId == null) storeId = 1L;
		AnalyticsSearchDto cond = new AnalyticsSearchDto(
				LocalDate.parse(start),
				LocalDate.parse(end),
				AnalyticsSearchDto.ViewBy.MONTH,
				size,
				cursor
		);
		return ResponseEntity.ok(service.getOrderMonthlyRows(storeId, cond));
	}


	// ======================
	// 메뉴 분석 Summary (상단 카드)
	// ======================
	@Operation(
			summary = "메뉴 분석 요약 카드",
			description = "판매수량 TOP3, 카테고리 매출 TOP3, 평균 판매가, 재고 소진률 TOP3를 반환합니다. " +
					"기간은 KPI/주문 요약과 동일하게 '이번달 1일 ~ 어제까지(MTD)' 기준입니다."
	)
	@GetMapping("/api/analytics/menus/summary")
	public ResponseEntity<MenuSummaryDto> getMenuSummary(
			@RequestParam(required = false) Long storeId
	) {
		if (storeId == null) storeId = 1L; // 임시, 나중에 @StoreScoped 교체
		return ResponseEntity.ok(service.getMenuSummary(storeId));
	}

	// ======================
	// 메뉴 분석 테이블 - 일별
	// ======================

	@Operation(
			summary = "메뉴 분석 일별 테이블",
			description = "일별 메뉴 판매/매출/주문수 집계 테이블을 커서 페이징 형태로 반환합니다."
	)
	@GetMapping("/api/analytics/menus/day-rows")
	public ResponseEntity<CursorPage<MenuDailyRowDto>> getMenuDailyRows(
			@RequestParam String start,
			@RequestParam String end,
			@RequestParam(defaultValue = "50") Integer size,
			@RequestParam(required = false) String cursor,
			@RequestParam(required = false) Long storeId
	) {
		if (storeId == null) storeId = 1L;
		AnalyticsSearchDto cond = new AnalyticsSearchDto(
				LocalDate.parse(start),
				LocalDate.parse(end),
				AnalyticsSearchDto.ViewBy.DAY,
				size,
				cursor
		);
		return ResponseEntity.ok(service.getMenuDailyRows(storeId, cond));
	}

	// ======================
	// 메뉴 분석 테이블 - 월별
	// ======================

	@Operation(
			summary = "메뉴 분석 월별 테이블",
			description = "월별 메뉴 판매/매출/주문수 집계 테이블을 커서 페이징 형태로 반환합니다."
	)
	@GetMapping("/api/analytics/menus/month-rows")
	public ResponseEntity<CursorPage<MenuMonthlyRowDto>> getMenuMonthlyRows(
			@RequestParam String start,
			@RequestParam String end,
			@RequestParam(defaultValue = "50") Integer size,
			@RequestParam(required = false) String cursor,
			@RequestParam(required = false) Long storeId
	) {
		if (storeId == null) storeId = 1L;
		AnalyticsSearchDto cond = new AnalyticsSearchDto(
				LocalDate.parse(start),
				LocalDate.parse(end),
				AnalyticsSearchDto.ViewBy.MONTH,
				size,
				cursor
		);
		return ResponseEntity.ok(service.getMenuMonthlyRows(storeId, cond));
	}

	// ==================================================
	//               ★ 시간/요일 분석 (신규) ★
	// ==================================================

	/**
	 * 시간/요일 분석 상단 요약 카드
	 */
	@GetMapping("/api/analytics/time-day/summary")
	public ResponseEntity<TimeDaySummaryDto> getTimeDaySummary(
			@RequestParam(required = false) Long storeId
	) {
		if (storeId == null) storeId = 1L;
		return ResponseEntity.ok(service.getTimeDaySummary(storeId));
	}

	/**
	 * 시간대별 매출/주문수 차트
	 */
	@GetMapping("/api/analytics/time-day/hourly-chart")
	public ResponseEntity<java.util.List<TimeHourlyPointDto>> getTimeDayHourlyChart(
			@RequestParam String start,
			@RequestParam String end,
			@RequestParam(required = false) Long storeId
	) {
		if (storeId == null) storeId = 1L;
		LocalDate startDate = LocalDate.parse(start);
		LocalDate endDate = LocalDate.parse(end);
		return ResponseEntity.ok(service.getTimeDayHourlyChart(storeId, startDate, endDate));
	}

	/**
	 * 요일별 매출/주문수 차트
	 */
	@GetMapping("/api/analytics/time-day/weekday-chart")
	public ResponseEntity<java.util.List<WeekdaySalesPointDto>> getWeekdayChart(
			@RequestParam String start,
			@RequestParam String end,
			@RequestParam(required = false) Long storeId
	) {
		if (storeId == null) storeId = 1L;
		LocalDate startDate = LocalDate.parse(start);
		LocalDate endDate = LocalDate.parse(end);
		return ResponseEntity.ok(service.getWeekdayChart(storeId, startDate, endDate));
	}

	/**
	 * 시간/요일 분석 - 일별 테이블
	 */
	@GetMapping("/api/analytics/time-day/day-rows")
	public ResponseEntity<CursorPage<TimeDayDailyRowDto>> getTimeDayDailyRows(
			@RequestParam String start,
			@RequestParam String end,
			@RequestParam(defaultValue = "50") Integer size,
			@RequestParam(required = false) String cursor,
			@RequestParam(required = false) Long storeId
	) {
		if (storeId == null) storeId = 1L;
		AnalyticsSearchDto cond = new AnalyticsSearchDto(
				LocalDate.parse(start),
				LocalDate.parse(end),
				AnalyticsSearchDto.ViewBy.DAY,
				size,
				cursor
		);
		return ResponseEntity.ok(service.getTimeDayDailyRows(storeId, cond));
	}

	/**
	 * 시간/요일 분석 - 월별 테이블
	 */
	@GetMapping("/api/analytics/time-day/month-rows")
	public ResponseEntity<CursorPage<TimeDayMonthlyRowDto>> getTimeDayMonthlyRows(
			@RequestParam String start,
			@RequestParam String end,
			@RequestParam(defaultValue = "50") Integer size,
			@RequestParam(required = false) String cursor,
			@RequestParam(required = false) Long storeId
	) {
		if (storeId == null) storeId = 1L;
		AnalyticsSearchDto cond = new AnalyticsSearchDto(
				LocalDate.parse(start),
				LocalDate.parse(end),
				AnalyticsSearchDto.ViewBy.MONTH,
				size,
				cursor
		);
		return ResponseEntity.ok(service.getTimeDayMonthlyRows(storeId, cond));
	}
}
