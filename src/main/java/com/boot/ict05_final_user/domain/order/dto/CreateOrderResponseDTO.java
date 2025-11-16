package com.boot.ict05_final_user.domain.order.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOrderResponseDTO {
    private Long orderId;
    private String orderCode;
}
