package com.boot.ict05_final_user.domain.order.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOrderRequestDTO {
    private Long storeId;
    private String orderCode;            // "#0001"
    private String orderType;            // "VISIT" | "TAKEOUT" | "DELIVERY"  ✅ 대문자
    private String paymentType;          // "card" | "cash" | "voucher" | "external" ✅ 소문자
    private BigDecimal totalPrice;
    private BigDecimal discount;
    private String customerName;
    private List<OrderItemRequest> items;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class OrderItemRequest {
        private Long menuId;
        private Integer quantity;
        private BigDecimal unitPrice;
    }
}
