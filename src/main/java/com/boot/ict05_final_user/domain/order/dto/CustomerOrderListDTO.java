package com.boot.ict05_final_user.domain.order.dto;

import com.boot.ict05_final_user.domain.order.entity.CustomerOrder;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class CustomerOrderListDTO {

    private Long id;
    private String orderCode;
    private String orderType;      // VISIT / TAKEOUT / DELIVERY
    private String paymentType;    // CARD / CASH / VOUCHER / EXTERNAL
    private BigDecimal totalPrice;
    private String status;         // PENDING / PREPARING / READY ...
    private LocalDateTime orderDate;
    private String customerName;
    private String customerPhone;
    private String deliveryAddress;
    private List<CustomerOrderItemDTO> items;

    public static CustomerOrderListDTO from(CustomerOrder order) {

        // 🔥 주문 상세 → 메뉴 리스트 변환
        List<CustomerOrderItemDTO> items = order.getDetails().stream()
                .map(d -> CustomerOrderItemDTO.builder()
                        .menuId(d.getMenuIdFk().getMenuId())
                        .menuName(d.getMenuIdFk().getMenuName())
                        .quantity(d.getQuantity())
                        .unitPrice(d.getUnitPrice())
                        .build()
                )
                .toList();

        return CustomerOrderListDTO.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .orderType(order.getOrderType().name())          // VISIT / TAKEOUT / DELIVERY
                .paymentType(order.getPaymentType().name())      // CARD / CASH / VOUCHER / EXTERNAL
                .totalPrice(order.getTotalPrice())
                .status(order.getStatus().name())                // PENDING / PREPARING ...
                .orderDate(order.getOrderedAt())                 // 주문일시
                .customerName(order.getMemo())                   // 메모를 고객명처럼 사용
                .customerPhone(null)                             // 아직 엔티티에 없으니 null
                .deliveryAddress(null)                           // 아직 엔티티에 없으니 null
                .items(items)
                .build();
    }
}
