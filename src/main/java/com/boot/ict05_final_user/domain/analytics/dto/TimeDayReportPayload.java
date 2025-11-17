package com.boot.ict05_final_user.domain.analytics.dto;

import java.util.List;

/**
 * Python FastAPI PDF 서비스에 전달할 시간/요일 분석 보고서 페이로드.
 *
 * 기존 Analytics DTO들을 그대로 포함해서 JSON으로 직렬화한다.
 */
public record TimeDayReportPayload(
        Long storeId,
        String storeName,
        String periodLabel,                 // 예: "2025-11-01 ~ 2025-11-17"
        TimeDaySummaryDto summary,          // 상단 요약 카드
        List<TimeHourlyPointDto> hourlyPoints,
        List<WeekdaySalesPointDto> weekdayPoints,

        String viewBy,                      // ✅ "DAY" or "MONTH"
        List<TimeDayDailyRowDto> dailyRows, // ✅ 일별 테이블 데이터
        List<TimeDayMonthlyRowDto> monthlyRows, // ✅ 월별 테이블 데이터

        String generatedAt                  // 생성 시각 (KST 기준 문자열)
) { }
