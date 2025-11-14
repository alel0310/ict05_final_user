package com.boot.ict05_final_user.domain.analytics.controller;

import com.boot.ict05_final_user.domain.analytics.dto.AnalyticsSearchDto;
import com.boot.ict05_final_user.domain.analytics.dto.CursorPage;
import com.boot.ict05_final_user.domain.analytics.dto.KpiRowDto;
import com.boot.ict05_final_user.domain.analytics.dto.KpiSummaryDto;
import com.boot.ict05_final_user.domain.analytics.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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

}
