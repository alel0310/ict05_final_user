package com.boot.ict05_final_user.domain.purchaseOrder.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    // 서버가 내려주는 읽기 전용
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Long id;                // pod.id

    // materialId, count만 클라에서 올 수 있도록 허용
    private Long materialId;        // material.id
    private Integer count;

    // 서버가 내려주는 읽기 전용(클라가 보내도 무시됨)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private String materialName;    // material.name

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private BigDecimal unitPrice;   // pod.unitPrice

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private BigDecimal totalPrice;  // pod.totalPrice

}
