package com.boot.ict05_final_user.domain.order.dto;

import com.boot.ict05_final_user.domain.order.entity.CustomerOrder;
import com.boot.ict05_final_user.domain.order.entity.CustomerOrderDetail;
import com.boot.ict05_final_user.domain.order.entity.OrderStatus;
import com.boot.ict05_final_user.domain.order.entity.OrderType;
import com.boot.ict05_final_user.domain.order.entity.PaymentType;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class CustomerOrderDetailDTO {

    private Long orderId;
    private String orderCode;
    private LocalDateTime orderedAt;

    private String customerName;
    private String customerPhone;

    private OrderStatus status;
    private OrderType orderType;
    private PaymentType paymentType;

    private int totalPrice;   // 결제 총액
    private int discount;     // 할인
    private int originalTotal;// 원가 = totalPrice + discount

    private List<ItemDTO> items;

    @Data
    public static class ItemDTO {
        private Long menuId;
        private String menuName;
        private int unitPrice;
        private int quantity;
        private int lineTotal;

        public static ItemDTO from(CustomerOrderDetail d) {
            ItemDTO dto = new ItemDTO();
            dto.setMenuId(d.getMenuIdFk().getMenuId());
            dto.setMenuName(d.getMenuIdFk().getMenuName());
            dto.setUnitPrice(d.getUnitPrice().intValue());
            dto.setQuantity(d.getQuantity());
            dto.setLineTotal(d.getUnitPrice().intValue() * d.getQuantity());
            return dto;
        }
    }

    public static CustomerOrderDetailDTO from(CustomerOrder order, List<CustomerOrderDetail> details) {
        CustomerOrderDetailDTO dto = new CustomerOrderDetailDTO();
        dto.setOrderId(order.getId());
        dto.setOrderCode(order.getOrderCode());
        dto.setOrderedAt(order.getOrderedAt());
        dto.setCustomerName(order.getMemo());          // 메모를 고객명으로 쓰고 있다면
        dto.setCustomerPhone(order.getCustomerPhone());

        dto.setStatus(order.getStatus());
        dto.setOrderType(order.getOrderType());
        dto.setPaymentType(order.getPaymentType());

        dto.setTotalPrice(order.getTotalPrice().intValue());
        dto.setDiscount(order.getDiscount().intValue());
        dto.setOriginalTotal(order.getTotalPrice().intValue() + order.getDiscount().intValue());

        dto.setItems(details.stream()
                .map(ItemDTO::from)
                .collect(Collectors.toList()));

        return dto;
    }
}
