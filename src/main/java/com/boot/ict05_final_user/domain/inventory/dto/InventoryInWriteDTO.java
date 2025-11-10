package com.boot.ict05_final_user.domain.inventory.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 입고 등록 DTO (본사/가맹점 공용)
 */
@Data
public class InventoryInWriteDTO {

    /** 입고 대상 재료 ID */
    private Long materialId;

    /** 입고 수량 */
    private BigDecimal quantity;

    /** 입고 단가 (본사 매입가) */
    private BigDecimal unitPrice;

    /** 출고 단가 (가맹점 공급가) */
    private BigDecimal sellingPrice;

    /** 입고일 */
    private LocalDateTime inDate;

    /** 유통기한 */
    private LocalDate expirationDate;

    /** 비고 */
    private String memo;

    /** 가맹점 ID (선택) */
    private Long storeId;
}
