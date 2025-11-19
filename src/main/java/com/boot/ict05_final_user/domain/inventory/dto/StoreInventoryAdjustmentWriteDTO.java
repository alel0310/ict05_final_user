package com.boot.ict05_final_user.domain.inventory.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 가맹점 재고 조정 요청 DTO
 *
 * <p>프론트의 "재고 조정" 폼에서 전달되는 입력용 DTO.
 * 매장 단은 LOT를 관리하지 않으므로 총량 기준으로 조정한다.</p>
 *
 * <ul>
 *   <li>storeMaterialId: 가맹점 재료 PK</li>
 *   <li>newQuantity: 조정 후 수량(절대값, 소수 3자리까지)</li>
 *   <li>reason: 조정 사유(MANUAL, DAMAGE, LOSS, ERROR) — 본사 Enum 재사용</li>
 *   <li>adjustDate: 조정 시각(옵션, 미지정 시 서비스에서 now 적용)</li>
 *   <li>memo: 비고</li>
 * </ul>
 *
 * <p>서비스 계층 처리 규칙(요약):</p>
 * <ol>
 *   <li>현재 재고(current)를 조회하고 diff = newQuantity - current 계산</li>
 *   <li>StoreInventoryAdjustment 생성(전/후/차이, reason, memo)</li>
 *   <li>StoreInventory 집계 수량을 newQuantity로 업데이트(0 미만 방지)</li>
 *   <li>단가 정책: 필요 시 조정 단가 생성(정책상 선택 — 판매/입고 단가와 구분)</li>
 *   <li>v_store_inventory_log에서 통합 조회</li>
 * </ol>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreInventoryAdjustmentWriteDTO {

    /** 가맹점 재료 PK (store_material.store_material_id) */
    @NotNull(message = "가맹점 재료 ID는 필수입니다.")
    private Long storeMaterialId;

    /** 조정 후 수량 (0 이상, 소수 3자리까지) */
    @NotNull(message = "조정 후 수량은 필수입니다.")
    @DecimalMin(value = "0.000", message = "조정 후 수량은 0 미만일 수 없습니다.")
    @Digits(integer = 12, fraction = 3)
    private BigDecimal newQuantity;

    /** 조정 사유 (MANUAL, DAMAGE, LOSS, ERROR) — 본사 Enum 재사용 */
    @NotNull(message = "조정 사유는 필수입니다.")
    private String reason;

    /** 조정 시각(옵션). 미전달 시 서비스에서 now 적용 권장 */
    private LocalDateTime adjustDate;

    /** 비고(옵션) */
    private String memo;
}
