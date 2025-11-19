package com.boot.ict05_final_user.domain.order.service;

import com.boot.ict05_final_user.domain.menu.entity.Menu;
import com.boot.ict05_final_user.domain.menu.repository.MenuRepository;
import com.boot.ict05_final_user.domain.order.dto.*;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
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

    // ─────────────────────
    // 주문 생성
    // ─────────────────────
    @Transactional
    public CreateOrderResponseDTO create(CreateOrderRequestDTO req, Long storeId) {

        log.info("▶ create order storeId(from login user) = {}", storeId);

        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new IllegalArgumentException("Store not found: " + storeId));

        String orderCode = generateOrderCode();

        CustomerOrder order = CustomerOrder.builder()
                .store(store)                                                    // ✅ 로그인 점포
                .orderCode(orderCode)
                .orderType(OrderType.from(req.getOrderType()))                  // "VISIT"
                .paymentType(resolvePaymentType(req.getPaymentType()))          // "card" / "CARD" / "카드"
                .totalPrice(req.getTotalPrice())
                .discount(req.getDiscount())
                .status(OrderStatus.PREPARING)                                  // 결제 직후 주방에 보여야 하므로 준비중
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
    // 주문 리스트 검색/필터
    // ─────────────────────
    public List<CustomerOrderListDTO> searchOrderList(
            Long storeId,                    // ✅ 로그인 가맹점 ID
            String keyword,
            String statusText,
            String paymentTypeText,
            String orderTypeText,
            String period // all / today / week / month
    ) {
        // 1) 해당 가맹점의 주문을 최신순으로 가져온다
        List<CustomerOrder> orders =
                orderRepository.findByStore_Id(storeId, Sort.by(Sort.Direction.DESC, "id"));

        // 2) 기간(period) 필터링
        LocalDate today = LocalDate.now();

        List<CustomerOrder> filtered = orders.stream()
                .filter(o -> {
                    LocalDate createdDate = o.getOrderedAt().toLocalDate();

                    if (period == null || period.isBlank() || "today".equalsIgnoreCase(period)) {
                        return createdDate.isEqual(today);
                    } else if ("week".equalsIgnoreCase(period)) {
                        LocalDate aWeekAgo = today.minusDays(6);
                        return !createdDate.isBefore(aWeekAgo) && !createdDate.isAfter(today);
                    } else if ("month".equalsIgnoreCase(period)) {
                        LocalDate firstDay = today.withDayOfMonth(1);
                        return !createdDate.isBefore(firstDay) && !createdDate.isAfter(today);
                    } else {
                        return true; // all
                    }
                })
                .toList();

        int MAX_SIZE = 100;
        if (filtered.size() > MAX_SIZE) {
            log.warn("orders api result size = {}, limit to {}", filtered.size(), MAX_SIZE);
            filtered = filtered.subList(0, MAX_SIZE);
        } else {
            log.info("orders api result size = {}", filtered.size());
        }

        return filtered.stream()
                .map(CustomerOrderListDTO::from)
                .toList();
    }

    // ─────────────────────
    // 주문 상세 조회 (로그인한 가맹점 기준)
    // ─────────────────────
    public CustomerOrderDetailDTO getOrderDetail(Long storeId, Long orderId) {
        CustomerOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        // 🔐 로그인한 가맹점의 주문인지 확인
        if (!order.getStore().getId().equals(storeId)) {
            throw new IllegalStateException("다른 매장의 주문에 접근할 수 없습니다.");
        }

        List<CustomerOrderDetail> details = detailRepository.findByOrder_Id(orderId);

        return CustomerOrderDetailDTO.from(order, details);
    }

    public Page<CustomerOrderListDTO> searchOrderListPage(
            Long storeId,
            CustomerOrderSearchDTO cond,
            Pageable pageable
    ) {
        var page = orderRepository.searchOrders(storeId, cond, pageable);
        return page.map(CustomerOrderListDTO::from);
    }

    private String generateOrderCode() {
        Long lastId = orderRepository.findTopByOrderByIdDesc()
                .map(CustomerOrder::getId)
                .orElse(0L);

        long next = lastId + 1;
        return String.format("#%04d", next);
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
