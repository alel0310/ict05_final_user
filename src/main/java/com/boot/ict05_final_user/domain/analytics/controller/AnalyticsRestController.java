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

	@GetMapping("/api/analytics/kpi/summary")
	public ResponseEntity<KpiSummaryDto> getKpiSummary(
			// @StoreScoped Long storeId
			Long storeId // 임시 파라미터(로컬 테스트). 운영 시 @StoreScoped로 교체
	) {
		if (storeId == null) storeId = 1L; // 임시 방어
		return ResponseEntity.ok(service.getKpiSummary(storeId));
	}

	@GetMapping("/api/analytics/kpi/rows")
	public ResponseEntity<CursorPage<KpiRowDto>> getKpiRows(
			// @StoreScoped Long storeId,
			@RequestParam String start,
			@RequestParam String end,                 // endExclusive(다음날 00:00) 권장
			@RequestParam(defaultValue = "DAY") AnalyticsSearchDto.ViewBy viewBy,
			@RequestParam(defaultValue = "50") Integer size,
			@RequestParam(required = false) String cursor,
			Long storeId // 임시 파라미터 (운영시 @StoreScoped 교체)
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
