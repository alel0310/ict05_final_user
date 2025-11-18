package com.boot.ict05_final_user.domain.analytics.dto;

import java.util.List;

/**
 * 재료 분석 PDF 페이로드.
 *
 * <p>
 * 상단 요약 카드 + 일/월별 테이블 데이터를 한 번에 포함한다.
 * TimeDayReportPayload 패턴을 그대로 따라간다.
 * </p>
 */
public record MaterialReportPayload(

        /** 점포 ID */
        Long storeId,

        /** 점포명 (리포트 상단 타이틀에 사용) */
        String storeName,

        /** 기간 라벨 (예: "2025-11-01 ~ 2025-11-17") */
        String periodLabel,

        /** 상단 요약 카드 데이터 */
        MaterialSummaryDto summary,

        /** "DAY" 또는 "MONTH" */
        String viewBy,

        /** 일별 테이블 데이터 */
        List<MaterialDailyRowDto> dailyRows,

        /** 월별 테이블 데이터 */
        List<MaterialMonthlyRowDto> monthlyRows,

        /** 리포트 생성 시각 (KST 기준 ISO-8601 문자열) */
        String generatedAt
) {
}
