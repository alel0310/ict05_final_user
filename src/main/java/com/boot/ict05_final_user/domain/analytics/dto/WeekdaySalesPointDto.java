package com.boot.ict05_final_user.domain.analytics.dto;

/**
 * 요일별 매출/주문수 차트 포인트.
 *
 * weekday: 1~7, 월=1, 화=2, …, 일=7
 */
public record WeekdaySalesPointDto(
        int weekday,
        long sales,
        long orders
) {
}
