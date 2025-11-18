package com.boot.ict05_final_user.domain.kitchen.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KitchenOrderResponseDTO {

    private Long id;
    private String orderCode;

    private List<KitchenOrderItemDTO> items;

    private BigDecimal total;          // 주문 총금액
    private BigDecimal originalTotal;  // 할인 전 금액
    private BigDecimal discount;       // 할인 금액

    // "preparing" | "cooking" | "ready" | "completed"
    private String status;

    private LocalDateTime orderTime;

    private String customer;
    private String paymentMethod;
    private String orderType;
    private String priority;
    private String notes;
}
