package com.boot.ict05_final_user.domain.analytics.dto;

/**
 * 재료 분석 - 월별 테이블 한 행 DTO.
 *
 * <p>1 row = [월, 재료] 조합 하나.</p>
 *
 * <ul>
 *   <li>yearMonth: 기준 월 (YYYY-MM)</li>
 *   <li>materialName: 재료명</li>
 *   <li>usedQuantity: 해당 월 동안의 소모량 합계</li>
 *   <li>cost: 해당 월 동안의 원가 합계(원)</li>
 *   <li>costRate: 해당 재료 원가 ÷ 전체 매출 × 100 (%, 소수점 1자리)</li>
 *   <li>lastInboundMonth: 해당 재료의 최근 입고가 있었던 월 (YYYY-MM, 없으면 null)</li>
 * </ul>
 */
public record MaterialMonthlyRowDto(
        String yearMonth,       // YYYY-MM
        String materialName,    // 재료명
        double usedQuantity,    // 사용량 합계
        long cost,              // 원가 합계(₩)
        double costRate,        // 원가율(%), 0~100, 소수점 1자리
        String lastInboundMonth // 최근 입고월 (YYYY-MM) or null
) {
}
