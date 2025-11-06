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

    /** 발주 상세 시퀀스 */
    @Schema(description = "품목 ID")
    private Long detailId;

    /** 발주 품목 재료명 */
    @Schema(description = "재료명")
    private String name;

    /** 발주 품목 단위 */
    @Schema(description = "단위")
    private String unit;

    /** 발주 품목 수량 */
    @Schema(description = "발주 수량")
    private Integer quantity;

    /** 발주 품목 단가 */
    @Schema(description = "단가")
    private BigDecimal unitPrice;

    /** 발주 품목 총금액 */
    @Schema(description = "총 금액")
    private BigDecimal totalPrice;
}
