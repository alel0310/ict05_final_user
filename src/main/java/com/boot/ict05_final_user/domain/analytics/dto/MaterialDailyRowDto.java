package com.boot.ict05_final_user.domain.analytics.dto;

/**
 * 재료 분석 - 일별 테이블 한 행 DTO.
 *
 * <p>1 row = [날짜, 재료] 조합 하나.</p>
 *
 * <ul>
 *   <li>useDate: 사용 기준 일자 (YYYY-MM-DD)</li>
 *   <li>materialName: 재료명</li>
 *   <li>usedQuantity: 해당 일자에 소모된 재료 수량 (기준 단위)</li>
 *   <li>unitName: 단위 (g, kg, ml, 개 등)</li>
 *   <li>cost: 해당 일자 재료 원가 합계(원)</li>
 *   <li>salesShare: 해당 재료 원가가 "그날 매출"에서 차지하는 비중(%)</li>
 *   <li>lastInboundDate: 최근 입고일 (YYYY-MM-DD, 없으면 null)</li>
 * </ul>
 */
public record MaterialDailyRowDto(
        String useDate,        // YYYY-MM-DD
        String materialName,   // 재료명
        double usedQuantity,   // 사용량
        String unitName,       // 단위
        long cost,             // 원가(₩)
        double salesShare,     // 매출대비 비중(%), 0~100, 소수점 1자리
        String lastInboundDate // 최근 입고일 (YYYY-MM-DD) or null
) {
}
