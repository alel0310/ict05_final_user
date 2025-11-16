package com.boot.ict05_final_user.domain.order.dto;

import com.boot.ict05_final_user.domain.order.entity.CustomerOrder;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class CustomerOrderListDTO {

    private Long id;
    private String orderCode;
    private String orderType;      // VISIT / TAKEOUT / DELIVERY
    private String paymentType;    // CARD / CASH / VOUCHER / EXTERNAL
    private BigDecimal totalPrice;
    private BigDecimal discount;
    private String status;         // PENDING / PREPARING / READY ...
    private LocalDateTime orderDate;
    private String customerName;

    public static CustomerOrderListDTO from(CustomerOrder order) {
        return CustomerOrderListDTO.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .orderType(order.getOrderType() != null ? order.getOrderType().name() : null)
                .paymentType(order.getPaymentType() != null ? order.getPaymentType().name() : null)
                .totalPrice(order.getTotalPrice())
                .discount(order.getDiscount())
                .status(order.getStatus() != null ? order.getStatus().name() : null)
                // 컬럼명이 customer_order_date 라면 엔티티에 아마 orderedAt / orderDate 같은 필드가 있을 거야
                .orderDate(order.getOrderedAt())   // 이름 다르면 여기를 맞춰줘
                .customerName(order.getMemo())
                .build();
    }
}
