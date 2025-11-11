package com.boot.ict05_final_user.domain.analytics.repository;

import com.boot.ict05_final_user.domain.analytics.dto.AnalyticsSearchDto;
import com.boot.ict05_final_user.domain.analytics.dto.CursorPage;
import com.boot.ict05_final_user.domain.analytics.dto.KpiRowDto;
import com.boot.ict05_final_user.domain.analytics.dto.KpiSummaryDto;

import java.time.LocalDate;

public interface AnalyticsRespositoryCustom {
	KpiSummaryDto fetchKpiSummary(Long storeId, LocalDate today);
	CursorPage<KpiRowDto> fetchKpiRows(Long storeId, AnalyticsSearchDto cond);
}
