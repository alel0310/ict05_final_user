package com.boot.ict05_final_user.domain.analytics.repository;

import com.boot.ict05_final_user.domain.analytics.dto.*;
import java.time.LocalDate;

public interface AnalyticsRespositoryCustom {

	// KPI
	KpiSummaryDto fetchKpiSummary(Long storeId, LocalDate today);
	CursorPage<KpiRowDto> fetchKpiRows(Long storeId, AnalyticsSearchDto cond);

	// 주문 분석
	OrderSummaryDto fetchOrderSummary(Long storeId, LocalDate today);
	CursorPage<OrderDailyRowDto> fetchOrderDailyRows(Long storeId, AnalyticsSearchDto cond);
	CursorPage<OrderMonthlyRowDto> fetchOrderMonthlyRows(Long storeId, AnalyticsSearchDto cond);
}
