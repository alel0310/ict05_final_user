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

	// 메뉴 분석
	MenuSummaryDto fetchMenuSummary(Long storeId, LocalDate today);
	CursorPage<MenuDailyRowDto> fetchMenuDailyRows(Long storeId, AnalyticsSearchDto cond);
	CursorPage<MenuMonthlyRowDto> fetchMenuMonthlyRows(Long storeId, AnalyticsSearchDto cond);

	// =========================
	//  시간/요일 분석 (신규)
	// =========================
	TimeDaySummaryDto fetchTimeDaySummary(Long storeId, LocalDate today);

	java.util.List<TimeHourlyPointDto> fetchTimeHourlyChart(Long storeId, LocalDate startDate, LocalDate endDate);

	java.util.List<WeekdaySalesPointDto> fetchWeekdayChart(Long storeId, LocalDate startDate, LocalDate endDate);

	CursorPage<TimeDayDailyRowDto> fetchTimeDayDailyRows(Long storeId, AnalyticsSearchDto cond);

	CursorPage<TimeDayMonthlyRowDto> fetchTimeDayMonthlyRows(Long storeId, AnalyticsSearchDto cond);
}
