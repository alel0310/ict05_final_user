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
	// ===== 메뉴 분석 =====

	/**
	 * 메뉴 분석 상단 카드 요약.
	 *
	 * - 판매수량 TOP3
	 * - 카테고리 매출 TOP3
	 * - 메뉴 평균 판매가 (전체 메뉴 매출 ÷ 전체 판매수량)
	 * - 재고 소진률 TOP3
	 */
	public MenuSummaryDto getMenuSummary(Long storeId, LocalDate start, LocalDate end) {
		return repo.fetchMenuSummary(storeId, start, end);
	}

	/**
	 * 메뉴 분석 일별 테이블.
	 */
	public CursorPage<MenuDailyRowDto> getMenuDailyRows(Long storeId, AnalyticsSearchDto cond) {
		return repo.fetchMenuDailyRows(storeId, cond);
	}

	/**
	 * 메뉴 분석 월별 테이블.
	 */
	public CursorPage<MenuMonthlyRowDto> getMenuMonthlyRows(Long storeId, AnalyticsSearchDto cond) {
		return repo.fetchMenuMonthlyRows(storeId, cond);
	}

}
