package com.boot.ict05_final_user.domain.order.controller;

import com.boot.ict05_final_user.domain.order.dto.CreateOrderRequestDTO;
import com.boot.ict05_final_user.domain.order.dto.CreateOrderResponseDTO;
import com.boot.ict05_final_user.domain.order.dto.CustomerOrderListDTO;
import com.boot.ict05_final_user.domain.order.dto.UpdateStatusRequestDTO;
import com.boot.ict05_final_user.domain.order.service.CustomerOrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<CreateOrderResponseDTO> create(@RequestBody CreateOrderRequestDTO req) {
        return ResponseEntity.ok(orderService.create(req));
    }

    /**
     * 주문 리스트 (가맹점 주문 목록 화면)
     * 검색/필터는 모두 쿼리 파라미터로 받아서 서비스에서 처리
     */
    @GetMapping
    public ResponseEntity<List<CustomerOrderListDTO>> listForStore(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentType,
            @RequestParam(required = false) String orderType,
            @RequestParam(required = false, defaultValue = "all") String period
    ) {
        try {
            List<CustomerOrderListDTO> list =
                    orderService.searchOrderList(keyword, status, paymentType, orderType, period);

            log.info("orders api result size = {}", list.size()); // 디버깅용

            return ResponseEntity.ok(list);   // ★ Page 말고 List
        } catch (Exception e) {
            log.error("[GET /api/customer-orders] 주문 리스트 조회 중 오류", e);
            return ResponseEntity.ok(Collections.emptyList());
        }
    }


    @PatchMapping("/{orderId}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable Long orderId,
                                             @RequestBody UpdateStatusRequestDTO body) {
        orderService.updateStatus(orderId, body.getStatus());
        return ResponseEntity.noContent().build();
    }
}
