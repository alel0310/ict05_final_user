package com.boot.ict05_final_user.domain.inventory.dto;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

/**
 * 가맹점 재료 상세 설정 저장 응답 DTO.
 *
 * <p>용도</p>
 * <ul>
 *   <li>팝업(설정) 저장 이후, 갱신된 가맹점 재료의 핵심 필드와 인벤토리 스냅샷을 반환한다.</li>
 * </ul>
 *
 * <p>구성</p>
 * <ul>
 *   <li>{@code storeMaterialId}: 대상 가맹점 재료 PK.</li>
 *   <li>{@code optimalQuantity}: 가맹점 재료의 적정 재고량(단위: 소진 단위, null 허용).</li>
 *   <li>{@code status}: 가맹점 재료 사용 여부(문자열, {@code USE|STOP}).</li>
 *   <li>{@code inventory}: 연계 인벤토리 스냅샷(옵션), 적정 재고 동기화 및 상태 재계산 결과 포함.</li>
 * </ul>
 *
 * <p>비고</p>
 * <ul>
 *   <li>수량/금액 단위 규칙은 서비스 단의 계약을 따른다.</li>
 *   <li>상태(status) 계산은 서비스에서 수행되며, 본 DTO는 결과를 단순 전달한다.</li>
 * </ul>
 */
@Value
@Builder
public class StoreMaterialSettingsResponseDTO {

    /** 대상 가맹점 재료 PK. */
    Long storeMaterialId;

    /** 가맹점 재료 적정 재고량(소진 단위, 0 이상, null 허용). */
    BigDecimal optimalQuantity;

    /** 가맹점 재료 상태. {@code USE | STOP}. */
    String status;

    /** 인벤토리 스냅샷(동기화 및 상태 재계산 결과). */
    InventoryPart inventory;

    /**
     * 인벤토리 일부 필드 스냅샷.
     *
     * <p>용도</p>
     * <ul>
     *   <li>설정 저장 직후의 인벤토리 적정 재고 및 상태를 확인하기 위한 최소 정보.</li>
     * </ul>
     *
     * <p>구성</p>
     * <ul>
     *   <li>{@code storeInventoryId}: 가맹점 인벤토리 PK.</li>
     *   <li>{@code optimalQuantity}: 인벤토리 적정 재고량(소진 단위, 0 이상, null 허용).</li>
     *   <li>{@code status}: 인벤토리 상태(문자열, {@code SUFFICIENT|LOW|SHORTAGE}).</li>
     * </ul>
     */
    @Value
    @Builder
    public static class InventoryPart {

        /** 가맹점 인벤토리 PK. */
        Long storeInventoryId;

        /** 인벤토리 적정 재고량(소진 단위, 0 이상, null 허용). */
        BigDecimal optimalQuantity;

        /** 인벤토리 상태. {@code SUFFICIENT | LOW | SHORTAGE}. */
        String status;
    }
}
