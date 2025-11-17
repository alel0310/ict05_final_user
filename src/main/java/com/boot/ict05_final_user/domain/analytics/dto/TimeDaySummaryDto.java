package com.boot.ict05_final_user.domain.analytics.dto;

/**
 * 시간/요일 분석 상단 요약 카드 DTO.
 *
 * - 분석 대상: 단일 매장(storeId)
 * - 기간: [startDate, endDate] (영업시간 07~20시만 집계)
 *
 * peakHour / offpeakHour / topWeekday 가 null 이면 해당 구간에 데이터가 없다는 의미.
 */
public record TimeDaySummaryDto(
        Integer peakHour,        // 피크 시간대 (7~20), null 가능
        long peakHourSales,      // 피크 시간대 매출

        Integer offpeakHour,     // 비수 시간대 (7~20, 매출>0 중 최소), null 가능
        long offpeakHourSales,   // 비수 시간대 매출

        Integer topWeekday,      // 최고 매출 요일 (1~7, 월=1), null 가능
        long topWeekdaySales,    // 최고 매출 요일 매출

        long weekdaySales,       // 주중(월~금) 매출 합
        long weekendSales        // 주말(토,일) 매출 합
) {
}
