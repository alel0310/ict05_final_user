package com.boot.ict05_final_user.domain.analytics.dto;

/**
 * 재료 Top 랭킹 카드에서 사용되는 단일 재료 정보 DTO.
 *
 * <p>사용량 기준 / 원가 기준 Top 리스트에서 공통으로 사용.</p>
 */
public record MaterialTopItemDto(
        Long materialId,      // 재료 ID
        String materialName,  // 재료명
        String unitName,      // 단위명 (예: g, kg, ml, 개 등)
        double usedQuantity,  // 기간 내 소모량 합계 (기준 단위, 소수점 허용)
        long cost             // 기간 내 재료 원가 합계(원)
) {
}
