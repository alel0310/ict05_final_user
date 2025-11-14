package com.boot.ict05_final_user.domain.order.service;

import com.boot.ict05_final_user.domain.menu.entity.Menu;
import com.boot.ict05_final_user.domain.menu.repository.MenuRepository;
import com.boot.ict05_final_user.domain.order.dto.CreateOrderRequestDTO;
import com.boot.ict05_final_user.domain.order.dto.CreateOrderResponseDTO;
import com.boot.ict05_final_user.domain.order.dto.CustomerOrderListDTO;
import com.boot.ict05_final_user.domain.order.entity.CustomerOrder;
import com.boot.ict05_final_user.domain.order.entity.CustomerOrderDetail;
import com.boot.ict05_final_user.domain.order.entity.OrderStatus;
import com.boot.ict05_final_user.domain.order.entity.OrderType;
import com.boot.ict05_final_user.domain.order.entity.PaymentType;
import com.boot.ict05_final_user.domain.order.repository.CustomerOrderDetailRepository;
import com.boot.ict05_final_user.domain.order.repository.CustomerOrderRepository;
import com.boot.ict05_final_user.domain.store.entity.Store;
import com.boot.ict05_final_user.domain.store.repository.StoreRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerOrderService {

    private final CustomerOrderRepository orderRepository;
    private final CustomerOrderDetailRepository detailRepository;
    private final StoreRepository storeRepository;
    private final MenuRepository menuRepository;

    @Transactional
    public CreateOrderResponseDTO create(CreateOrderRequestDTO req) {
        Store store = storeRepository.findById(req.getStoreId())
                .orElseThrow(() -> new IllegalArgumentException("Store not found: " + req.getStoreId()));

        CustomerOrder order = CustomerOrder.builder()
                .store(store)
                .orderCode(req.getOrderCode())
                .orderType(OrderType.from(req.getOrderType()))                 // "VISIT"
                .paymentType(resolvePaymentType(req.getPaymentType()))        // "card" / "CARD" / "카드"
                .totalPrice(req.getTotalPrice())
                .discount(req.getDiscount())
                .status(OrderStatus.PREPARING)                                // 결제 직후 주방에 보여야 하므로 준비중
                .memo(req.getCustomerName())
                .build();

        order = orderRepository.save(order);

        for (CreateOrderRequestDTO.OrderItemRequest i : req.getItems()) {
            Menu menu = menuRepository.findById(i.getMenuId())
                    .orElseThrow(() -> new IllegalArgumentException("Menu not found: " + i.getMenuId()));

            CustomerOrderDetail d = CustomerOrderDetail.builder()
                    .order(order)
                    .menuIdFk(menu)
                    .quantity(i.getQuantity())
                    .unitPrice(i.getUnitPrice())
                    .build();
            detailRepository.save(d);
        }

        return CreateOrderResponseDTO.builder()
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .build();
    }

    @Transactional
    public void updateStatus(Long orderId, String statusText) {
        CustomerOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        // "PREPARING" 같은 enum name 우선 시도, 실패 시 한글값으로도 허용
        OrderStatus newStatus;
        try {
            newStatus = OrderStatus.valueOf(statusText.toUpperCase());
        } catch (Exception ignore) {
            newStatus = OrderStatus.from(statusText);
        }
        order.setStatus(newStatus);
    }

    public List<CustomerOrder> findForKitchen() {
        return orderRepository.findByStatusInOrderByOrderedAtAsc(
                List.of(OrderStatus.PREPARING, OrderStatus.READY)
        );
    }

    // ✅ 주문 리스트 화면용 DTO
    public List<CustomerOrderListDTO> findForKitchenList() {
        List<CustomerOrder> orders = findForKitchen();
        return orders.stream()
                .map(CustomerOrderListDTO::from)
                .toList();
    }

    // ✅ 컨트롤러에서 사용하는 safe 버전
    public List<CustomerOrderListDTO> findForKitchenListSafe() {
        try {
            return findForKitchenList();
        } catch (Exception e) {
            log.error("주문 리스트 조회 중 오류 발생", e);
            // 여기서도 예외 삼키고 빈 리스트
            return Collections.emptyList();
        }
    }

    // ─────────────────────────────────────────────
    // paymentType 문자열 → PaymentType enum 변환
    // ─────────────────────────────────────────────
    private PaymentType resolvePaymentType(String value) {
        if (value == null) {
            throw new IllegalArgumentException("paymentType is null");
        }
        String v = value.trim();

        // 1) enum name / 코드 형식: "CARD", "card"
        try {
            return PaymentType.valueOf(v.toUpperCase());
        } catch (Exception ignore) {
        }

        // 2) 한글 라벨: "카드", "현금", "상품권", "외부 결제"
        for (PaymentType type : PaymentType.values()) {
            if (type.getLabel().equals(v)) {
                return type;
            }
        }

        throw new IllegalArgumentException("Unknown paymentType: " + value);
    }
}
