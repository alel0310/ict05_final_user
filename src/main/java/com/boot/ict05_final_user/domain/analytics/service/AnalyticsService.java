package com.boot.ict05_final_user.domain.analytics.service;


import com.boot.ict05_final_user.domain.analytics.dto.AnalyticsSearchDto;
import com.boot.ict05_final_user.domain.analytics.dto.CursorPage;
import com.boot.ict05_final_user.domain.analytics.dto.KpiRowDto;
import com.boot.ict05_final_user.domain.analytics.dto.KpiSummaryDto;
import com.boot.ict05_final_user.domain.analytics.repository.AnalyticsRespositoryCustom;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

	private final AnalyticsRespositoryCustom repo;
	private static final ZoneId KST = ZoneId.of("Asia/Seoul");

	public KpiSummaryDto getKpiSummary(Long storeId) {
		LocalDate today = LocalDate.now(KST);
		return repo.fetchKpiSummary(storeId, today);
	}

	public CursorPage<KpiRowDto> getKpiRows(Long storeId, AnalyticsSearchDto cond) {
		return repo.fetchKpiRows(storeId, cond);
	}

}
