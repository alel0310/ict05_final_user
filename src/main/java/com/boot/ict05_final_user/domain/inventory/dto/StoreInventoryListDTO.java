package com.boot.ict05_final_user.domain.inventory.dto;

import com.boot.ict05_final_user.domain.inventory.entity.InventoryStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 가맹점 재고 목록 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreInventoryListDTO {

    /** 재고 ID */
    private Long id;

    /** 가맹점 ID */
    private Long storeId;

    /** 가맹점명 */
    private String storeName;

    /** 재료명 */
    private String materialName;

    /** 카테고리명 */
    private String categoryName;

    /** 현재 수량 */
    private BigDecimal quantity;

    /** 적정 수량 */
    private BigDecimal optimalQuantity;

    /** 재고 상태 */
    private InventoryStatus status;

    /** 마지막 수정일 */
    private LocalDateTime updateDate;
}
