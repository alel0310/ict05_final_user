package com.boot.ict05_final_user.domain.inventory.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 가맹점 입고 요청 DTO
 *
 * 프론트의 재입고 폼 입력을 1건 단위로 전달한다
 * 매장 단은 LOT를 관리하지 않으며 총량만 반영한다
 *
 * <p>단가 정책:
 * - HQ 재료: 본사 판매가를 단가로 사용(프런트 입력 불필요).
 * - 가맹점 자체 재료: 입력값이 없으면 최근 입고 단가를 기본값으로 사용.
 * - 위 모두 불가 시 400 반환.</p>
 *
 * 필드
 * - storeMaterialId 가맹점 재료 PK
 * - quantity 입고 수량 소수 3자리
 * - unitPrice 입고 단가 소수 2자리
 * - inDate 입고 시각 미전달 시 서비스에서 now 적용
 * - refHqOutId 본사 출고 참조 선택
 * - memo 비고
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreInventoryInWriteDTO {

    /** 재고 PK (store_inventory_id) */
    @NotNull(message = "재고 ID는 필수입니다.")
    private Long storeInventoryId;

    /** 가맹점 재료 PK (store_material_id) */
    @NotNull(message = "가맹점 재료 ID는 필수입니다.")
    private Long storeMaterialId;

    /** 입고 수량(0 이상) */
    @NotNull(message = "입고 수량은 필수입니다.")
    @DecimalMin(value = "0.0", inclusive = true, message = "입고 수량은 0 이상이어야 합니다.")
    private Double quantity;

    /** 메모(선택) */
    private String memo;

    /** 입고 단가(선택): null이면 서비스에서 정책에 따라 해석 */
    private Double unitPrice;

}
