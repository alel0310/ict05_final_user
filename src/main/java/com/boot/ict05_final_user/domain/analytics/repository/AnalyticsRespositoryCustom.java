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

	/**
	 * 재료 분석 상단 카드 요약을 조회한다.
	 *
	 * <p>기간 규칙은 AnalyticsService에서 today 기준으로 계산:
	 * 이번달 1일 ~ 어제까지(MTD) + 전월 동일기간 비교.</p>
	 */
	MaterialSummaryDto fetchMaterialSummary(Long storeId, LocalDate today);

	/**
	 * 재료 분석 일별 테이블 (커서 기반 페이징).
	 */
	CursorPage<MaterialDailyRowDto> fetchMaterialDailyRows(Long storeId, AnalyticsSearchDto cond);

	/**
	 * 재료 분석 월별 테이블 (커서 기반 페이징).
	 */
	CursorPage<MaterialMonthlyRowDto> fetchMaterialMonthlyRows(Long storeId, AnalyticsSearchDto cond);

}
