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

    @NotNull(message = "가맹점 재료 ID는 필수입니다.")
    private Long storeMaterialId;

    @NotNull(message = "입고 수량은 필수입니다.")
    @DecimalMin(value = "0.001", message = "입고 수량은 0보다 커야 합니다.")
    @Digits(integer = 12, fraction = 3)
    private BigDecimal quantity;

    @DecimalMin(value = "0.00", message = "단가는 음수가 될 수 없습니다.")
    @Digits(integer = 13, fraction = 2)
    private BigDecimal unitPrice;

    private LocalDateTime inDate;

    private Long refHqOutId;

    private String memo;
}
