package com.boot.ict05_final_user.domain.order.controller;

import com.boot.ict05_final_user.config.security.auth.CustomUserDetails; // ✅ 추가
import com.boot.ict05_final_user.config.security.principal.AppUser;
import com.boot.ict05_final_user.domain.order.dto.*;
import com.boot.ict05_final_user.domain.order.service.CustomerOrderService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal; // ✅ 추가
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/customer-orders")
public class CustomerOrderController {

    private final CustomerOrderService orderService;

    @PostMapping
    public ResponseEntity<CreateOrderResponseDTO> create(
            @AuthenticationPrincipal AppUser user,
            @RequestBody CreateOrderRequestDTO req,
            HttpServletRequest request
    ) {
        String authHeader = request.getHeader("Authorization");
        log.info("Authorization header = {}", authHeader); // 🔍 토큰 확인용

        if (user == null) {
            log.warn("Unauthenticated POST /api/customer-orders 요청");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Long storeId = user.getStoreId();
        log.info("create order by storeId={}", storeId);

        return ResponseEntity.ok(orderService.create(req, storeId));
    }

    /**
     * 주문 리스트 (가맹점 주문 목록 화면)
     * 검색/필터는 모두 쿼리 파라미터로 받아서 서비스에서 처리
     */
    @GetMapping
    public ResponseEntity<Page<CustomerOrderListDTO>> listForStore(
            @AuthenticationPrincipal AppUser user,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentType,
            @RequestParam(required = false) String orderType,
            @RequestParam(required = false, defaultValue = "all") String period,
            @PageableDefault(page = 0, size = 20,
                    sort = "id", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        if (user == null) {
            log.warn("Unauthenticated GET /api/customer-orders");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Long storeId = user.getStoreId();
        log.info("list orders for storeId={}", storeId);

        // 🔥 프론트에서 넘어온 값으로 검색 DTO 직접 만들어 주기
        CustomerOrderSearchDTO search = new CustomerOrderSearchDTO();
        search.setKeyword(keyword);
        search.setStatus(status);
        search.setPaymentType(paymentType);
        search.setOrderType(orderType);
        search.setPeriod(period);

        Page<CustomerOrderListDTO> pageResult =
                orderService.searchOrderListPage(storeId, search, pageable);

        log.info("orders api result size = {}, totalElements={}",
                pageResult.getNumberOfElements(), pageResult.getTotalElements());

        return ResponseEntity.ok(pageResult);
    }


    @PatchMapping("/{orderId}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable Long orderId,
                                             @RequestBody UpdateStatusRequestDTO body) {
        orderService.updateStatus(orderId, body.getStatus());
        return ResponseEntity.noContent().build();
    }

    /** 주문 상세 (로그인 가맹점 기준) */
    @GetMapping("/{orderId}")
    public ResponseEntity<CustomerOrderDetailDTO> getOrderDetail(
            @AuthenticationPrincipal AppUser user,
            @PathVariable Long orderId
    ) {
        if (user == null) {
            log.warn("Unauthenticated GET /api/customer-orders/{} 요청", orderId);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Long storeId = user.getStoreId();
        log.info("get order detail orderId={}, storeId={}", orderId, storeId);

        try {
            CustomerOrderDetailDTO dto = orderService.getOrderDetail(storeId, orderId);
            return ResponseEntity.ok(dto);
        } catch (IllegalStateException e) {
            // 다른 매장 주문 접근
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (IllegalArgumentException e) {
            // 주문 없음
            return ResponseEntity.notFound().build();
        }
    }

}
