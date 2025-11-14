package com.boot.ict05_final_user.domain.analytics.dto;

/**
 * 주문 분석 상단 카드 요약 DTO.
 * - 기간: 이번달 1일 00:00 ~ 어제 24:00 (today 00:00 기준 MTD)
 * - 기준: 단일 storeId, 상태 COMPLETED, KST
 */
public record OrderSummaryDto(
		long deliverySalesMtd, // 배달 매출
		long takeoutSalesMtd,  // 포장 매출
		long visitSalesMtd,    // 방문 매출
		long orderCountMtd     // 주문수
) {
}
