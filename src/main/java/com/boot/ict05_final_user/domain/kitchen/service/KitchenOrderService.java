package com.boot.ict05_final_user.domain.kitchen.service;

import com.boot.ict05_final_user.domain.kitchen.dto.KitchenOrderItemDTO;
import com.boot.ict05_final_user.domain.kitchen.dto.KitchenOrderResponseDTO;
import com.boot.ict05_final_user.domain.kitchen.dto.UpdateKitchenOrderStatusRequestDTO;
import com.boot.ict05_final_user.domain.menu.entity.Menu;
import com.boot.ict05_final_user.domain.order.entity.CustomerOrder;
import com.boot.ict05_final_user.domain.order.entity.CustomerOrderDetail;
import com.boot.ict05_final_user.domain.order.entity.OrderStatus;
import com.boot.ict05_final_user.domain.order.entity.OrderType;
import com.boot.ict05_final_user.domain.order.entity.PaymentType;
import com.boot.ict05_final_user.domain.order.repository.CustomerOrderDetailRepository;
import com.boot.ict05_final_user.domain.order.repository.CustomerOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class KitchenOrderService {

    private final CustomerOrderRepository orderRepository;
    private final CustomerOrderDetailRepository orderDetailRepository;  // 추가


    /**
     * 주방 화면 주문 목록
     * PREPARING + READY 만 조회
     */
    @Transactional(readOnly = true)
    public List<KitchenOrderResponseDTO> getKitchenOrders(Long storeId) {

        List<OrderStatus> statuses = Arrays.asList(
                OrderStatus.PREPARING,  // 준비중 (프론트: preparing / cooking)
                OrderStatus.READY       // 픽업대기 (프론트: ready)
        );

        List<CustomerOrder> orders = orderRepository
                .findByStore_IdAndStatusInOrderByCreatedAtAsc(storeId, statuses);

        return orders.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }


    /** 주문 상태 변경 */
    @Transactional
    public KitchenOrderResponseDTO updateStatus(Long orderId, UpdateKitchenOrderStatusRequestDTO req) {

        CustomerOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        // 프론트 상태를 백엔드 상태로 변환
        OrderStatus newStatus = fromFrontStatus(req.getStatus());

        // 상태 업데이트
        order.setStatus(newStatus);

        return toDto(order);
    }

    private KitchenOrderResponseDTO toDto(CustomerOrder order) {

        List<CustomerOrderDetail> details =
                orderDetailRepository.findByCustomerOrder_Id(order.getId());

        List<KitchenOrderItemDTO> items = details.stream()
                .map(this::toItemDto)
                .collect(Collectors.toList());

        return KitchenOrderResponseDTO.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .items(items)
                .total(order.getTotalPrice())
                .originalTotal(order.getTotalPrice())
                .discount(order.getDiscount())
                .status(toFrontStatus(order.getStatus()))
                .orderTime(order.getOrderedAt())
                .customer(order.getMemo())
                .paymentMethod(toKorPayment(order.getPaymentType()))
                .orderType(toKorOrderType(order.getOrderType()))
                .priority("normal")
                .notes(order.getMemo())
                .build();
    }

    private KitchenOrderItemDTO toItemDto(CustomerOrderDetail detail) {
        Menu menu = detail.getMenu();

        return KitchenOrderItemDTO.builder()
                .menuId(menu.getMenuId())
                .name(menu.getMenuName())
                .price(detail.getPrice())          // BigDecimal
                .quantity(detail.getQuantity())
                .image("🍔")
                .options(null)
                .build();
    }
}



    // ===================== 상태 매핑 ===================== //

    /** 백엔드 → 프론트 상태 변환 */
    private String toFrontStatus(OrderStatus status) {
        return switch (status) {
            case PREPARING -> "preparing";   // 프론트는 preparing/cooking 둘 다 PREPARING
            case READY -> "ready";
            case COMPLETED -> "completed";
            default -> "preparing";
        };
    }

    /** 프론트 → 백엔드 상태 변환 */
    private OrderStatus fromFrontStatus(String status) {
        return switch (status) {
            case "preparing" -> OrderStatus.PREPARING;
            case "cooking" -> OrderStatus.PREPARING;   // cooking 도 PREPARING 으로 저장
            case "ready" -> OrderStatus.READY;
            case "completed" -> OrderStatus.COMPLETED;
            default -> throw new IllegalArgumentException("Unknown status: " + status);
        };
    }



    // ===================== 한글 매핑 ===================== //

    private String toKorOrderType(OrderType type) {
        if (type == null) return "방문";
        return switch (type) {
            case VISIT -> "방문";
            case TAKEOUT -> "포장";
            case DELIVERY -> "배달";
        };
    }

    private String toKorPayment(PaymentType type) {
        if (type == null) return "기타";
        return switch (type) {
            case CARD -> "카드";
            case CASH -> "현금";
            case VOUCHER -> "상품권";
            case EXTERNAL -> "외부결제";
        };
    }
}
