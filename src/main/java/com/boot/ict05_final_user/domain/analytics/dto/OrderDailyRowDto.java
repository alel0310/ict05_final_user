package com.boot.ict05_final_user.domain.analytics.dto;

/**
 * 주문 분석 일별 테이블 한 행 (주문 1건 기준).
 */
public record OrderDailyRowDto(
		String orderDate,   // YYYY-MM-DD
		Long orderId,
		String orderCode,
		String orderType,   // VISIT / TAKEOUT / DELIVERY
		long totalPrice,    // 총금액
		long menuCount,     // 메뉴수(수량 합)
		String paymentType, // CARD / CASH / VOUCHER / EXTERNAL
		String channelMemo  // 메모(채널 메모 등)
) {
}
