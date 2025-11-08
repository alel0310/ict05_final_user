package com.boot.ict05_final_user.domain.purchaseOrder.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "발주 상세 품목 DTO")
public class PurchaseOrderItemDTO {

    /** 재료 시퀀스 */
    private Long MaterialId;

    /** 발주 품목 수량 */
    @Schema(description = "발주 수량")
    private Integer count;

}
