package com.boot.ict05_final_user.domain.analytics.dto;

/**
 * 시간대별 매출/주문수 차트용 포인트.
 *
 * - hour: 7~20 (07:00~07:59 → 7)
 */
public record TimeHourlyPointDto(
        int hour,             // 7~20
        long sales,           // 매출액 합
        long orders,          // 주문수
        long visitOrders,     // 매장 주문수
        long takeoutOrders,   // 포장 주문수
        long deliveryOrders   // 배달 주문수
) {
}
