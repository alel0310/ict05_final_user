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

    // 서버가 내려주는 읽기 전용 (발주 상세 id)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Long id;                // pod.id

    // 클라이언트가 선택해서 보내는 가맹점 재료 키
    @Schema(description = "가맹점 재료 ID (StoreMaterial.id)")
    private Long storeMaterialId;

    // 본사 재료 키는 서버에서 StoreMaterial.material 로부터 채움
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @Schema(description = "본사 재료 ID (Material.id)")
    private Long materialId;

    // 수량만 쓰기 가능
    @Schema(description = "발주 수량")
    private Integer count;

    // 아래부터는 응답용 읽기 전용 필드
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private String materialName;    // 재료명 (보여주기용)

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private BigDecimal unitPrice;   // 단가

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private BigDecimal totalPrice;  // 합계 금액

}
