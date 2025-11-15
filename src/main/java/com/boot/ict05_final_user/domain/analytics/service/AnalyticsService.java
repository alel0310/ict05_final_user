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
	 * - 기준: KST 오늘 날짜 기준 "이번달 1일 ~ 어제까지"
	 * - 판매수량 TOP3 / 카테고리 매출 TOP3 / 평균 단가 / 재고 소진률 TOP3
	 */
	public MenuSummaryDto getMenuSummary(Long storeId) {
		LocalDate today = LocalDate.now(KST);
		return repo.fetchMenuSummary(storeId, today);
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
