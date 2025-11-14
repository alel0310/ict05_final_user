package com.boot.ict05_final_user.domain.analytics.service;


import com.boot.ict05_final_user.domain.analytics.dto.*;
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

	// ===== 주문 분석 =====
	public OrderSummaryDto getOrderSummary(Long storeId) {
		LocalDate today = LocalDate.now(KST);
		return repo.fetchOrderSummary(storeId, today);
	}

	public CursorPage<OrderDailyRowDto> getOrderDailyRows(Long storeId, AnalyticsSearchDto cond) {
		return repo.fetchOrderDailyRows(storeId, cond);
	}

	public CursorPage<OrderMonthlyRowDto> getOrderMonthlyRows(Long storeId, AnalyticsSearchDto cond) {
		return repo.fetchOrderMonthlyRows(storeId, cond);
	}

}
