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

        OrderStatus newStatus;
        try {
            newStatus = OrderStatus.valueOf(statusText.toUpperCase());
        } catch (Exception ignore) {
            newStatus = OrderStatus.from(statusText);
        }
        order.setStatus(newStatus);
    }

    // ─────────────────────
    // 주문 리스트 검색/필터 (새로 추가)
    // ─────────────────────
    public List<CustomerOrderListDTO> searchOrderList(
            String keyword,
            String statusText,
            String paymentTypeText,
            String orderTypeText,
            String period // all / today / week / month
    ) {

        // 1) 일단 전체 주문을 최신순으로 가져온다
        //    (나중에 필요하면 storeId 조건 추가 가능)
        List<CustomerOrder> orders =
                orderRepository.findAllByOrderByOrderedAtDesc();

        // 2) 자바 스트림으로 조건별 필터링
        return orders.stream()
                // 키워드: 주문코드 or 메모(고객명) 에 포함
                .filter(order -> {
                    if (keyword == null || keyword.isBlank()) return true;
                    String kw = keyword.trim().toLowerCase();
                    String code = safeLower(order.getOrderCode());
                    String memo = safeLower(order.getMemo());
                    return (code != null && code.contains(kw))
                            || (memo != null && memo.contains(kw));
                })
                // 상태 필터
                .filter(order -> {
                    if (statusText == null || statusText.isBlank()
                            || "all".equalsIgnoreCase(statusText)) {
                        return true;
                    }
                    if (order.getStatus() == null) return false;

                    // 프론트에서 pending/preparing/... 으로 오니까 enum name 기준
                    String target = statusText.trim().toUpperCase();
                    return order.getStatus().name().equalsIgnoreCase(target);
                })
                // 결제 방법 필터
                .filter(order -> {
                    if (paymentTypeText == null || paymentTypeText.isBlank()
                            || "all".equalsIgnoreCase(paymentTypeText)) {
                        return true;
                    }
                    if (order.getPaymentType() == null) return false;

                    String target = paymentTypeText.trim().toUpperCase();
                    // 프론트는 "카드결제/현금결제/상품권결제" 이런 한글도 쓰니까 라벨도 같이 비교
                    String label = order.getPaymentType().getLabel(); // "카드", "현금"...
                    String labelWithSuffix = label + "결제";

                    return order.getPaymentType().name().equalsIgnoreCase(target)
                            || label.equals(paymentTypeText.trim())
                            || labelWithSuffix.equals(paymentTypeText.trim());
                })
                // 주문 유형 필터 (VISIT / TAKEOUT / DELIVERY)
                .filter(order -> {
                    if (orderTypeText == null || orderTypeText.isBlank()
                            || "all".equalsIgnoreCase(orderTypeText)) {
                        return true;
                    }
                    if (order.getOrderType() == null) return false;

                    // 프론트는 "방문/포장/배달" → Enum 은 VISIT/TAKEOUT/DELIVERY
                    String t = orderTypeText.trim();
                    String enumName = order.getOrderType().name(); // VISIT...

                    if (t.equals("방문")) return enumName.equals("VISIT");
                    if (t.equals("포장")) return enumName.equals("TAKEOUT");
                    if (t.equals("배달")) return enumName.equals("DELIVERY");

                    // 그냥 enum name 으로 온 경우도 허용
                    return enumName.equalsIgnoreCase(t);
                })
                // 기간 필터 (오늘/일주일/한 달)
                .filter(order -> {
                    if (period == null || "all".equalsIgnoreCase(period)) return true;

                    LocalDateTime orderedAt = order.getOrderedAt();
                    if (orderedAt == null) return false;

                    LocalDateTime now = LocalDateTime.now();
                    LocalDateTime start;

                    switch (period.toLowerCase()) {
                        case "today" -> start = now.toLocalDate().atStartOfDay();
                        case "week" -> start = now.minusDays(7).toLocalDate().atStartOfDay();
                        case "month" -> start = now.minusDays(30).toLocalDate().atStartOfDay();
                        default -> {
                            return true;
                        }
                    }
                    return !orderedAt.isBefore(start);
                })
                // DTO 로 변환
                .map(CustomerOrderListDTO::from)
                .toList();
    }

    // ─────────────────────
    // paymentType 문자열 → PaymentType enum 변환 (기존)
    // ─────────────────────
    private PaymentType resolvePaymentType(String value) {
        if (value == null) {
            throw new IllegalArgumentException("paymentType is null");
        }
        String v = value.trim();

        try {
            return PaymentType.valueOf(v.toUpperCase());
        } catch (Exception ignore) {
        }

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
