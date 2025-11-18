package com.boot.ict05_final_user.domain.analytics.dto;

/**
 * 시간/요일 분석 - 월별 테이블 한 행.
 *
 * 1 row = [월(yearMonth), 요일, 시간대] 조합 하나.
 */
public record TimeDayMonthlyRowDto(
        String yearMonth,     // YYYY-MM
        int weekday,          // 1~7, 월=1
        int hour,             // 7~20

        long orderCount,      // 주문수
        long sales,           // 매출액

        long visitCount,      // 매장 주문수
        long takeoutCount,    // 포장 주문수
        long deliveryCount,   // 배달 주문수

        double visitRate,     // 매장 주문 비율 (0~1)
        double takeoutRate,   // 포장 주문 비율 (0~1)
        double deliveryRate   // 배달 주문 비율 (0~1)
) {
}
