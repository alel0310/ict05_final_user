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
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

// CustomerOrderService.java
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerOrderService {

    private final CustomerOrderRepository orderRepository;
    private final CustomerOrderDetailRepository detailRepository;
    private final StoreRepository storeRepository;
    private final MenuRepository menuRepository;

    // ─────────────────────
    // 주문 생성 (기존 그대로)
    // ─────────────────────
    @Transactional
    public CreateOrderResponseDTO create(CreateOrderRequestDTO req) {
        Store store = storeRepository.findById(req.getStoreId())
                .orElseThrow(() -> new IllegalArgumentException("Store not found: " + req.getStoreId()));

        String orderCode = generateOrderCode();

        CustomerOrder order = CustomerOrder.builder()
                .store(store)
                .orderCode(orderCode)
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

        OrderStatus newStatus;
        try {
            newStatus = OrderStatus.valueOf(statusText.toUpperCase());
        } catch (Exception ignore) {
            newStatus = OrderStatus.from(statusText);
        }
        order.setStatus(newStatus);
    }

    // ─────────────────────
// 주문 리스트 검색/필터 (임시: 전체 조회만)
// ─────────────────────
    public List<CustomerOrderListDTO> searchOrderList(
            String keyword,
            String statusText,
            String paymentTypeText,
            String orderTypeText,
            String period // all / today / week / month
    ) {
        // 1) 일단 전체 주문을 id 내림차순으로 가져온다
        List<CustomerOrder> orders =
                orderRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));

        // 2) DTO 로 변환만 한다 (필터링 X)
        return orders.stream()
                .map(CustomerOrderListDTO::from)
                .toList();
    }

    private String generateOrderCode() {
        Long lastId = orderRepository.findTopByOrderByIdDesc()
                .map(CustomerOrder::getId)
                .orElse(0L);

        long next = lastId + 1;
        return String.format("#%04d", next);   // #0001, #0002 ...
    }

    // ─────────────────────
    // paymentType 문자열 → PaymentType enum 변환 (기존)
    // ─────────────────────
    private PaymentType resolvePaymentType(String value) {
        if (value == null) {
            throw new IllegalArgumentException("paymentType is null");
        }

        String v = value.trim();

        // 0) "카드결제", "현금결제" 처럼 뒤에 "결제" 붙은 경우 잘라내기
        if (v.endsWith("결제")) {
            v = v.substring(0, v.length() - 2); // "카드결제" -> "카드"
        }

        // 1) enum name / 코드 형식: "CARD", "card"
        try {
            return PaymentType.valueOf(v.toUpperCase());
        } catch (Exception ignore) { }

        // 2) 한글 라벨: "카드", "현금", "상품권", "외부 결제"
        for (PaymentType type : PaymentType.values()) {
            if (type.getLabel().equals(v)) {
                return type;
            }
        }

        throw new IllegalArgumentException("Unknown paymentType: " + value);
    }


    private String safeLower(String s) {
        return s == null ? null : s.toLowerCase();
    }
}
