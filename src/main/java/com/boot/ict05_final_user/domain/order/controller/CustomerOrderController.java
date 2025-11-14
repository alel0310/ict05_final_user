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
     * 주문 리스트 (주방/가맹점 주문목록 화면)
     * 여기서는 절대 400/500 안 나가게 방어
     */
    @GetMapping
    public ResponseEntity<List<CustomerOrderListDTO>> listForKitchen() {
        try {
            List<CustomerOrderListDTO> list = orderService.findForKitchenListSafe();
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            log.error("[/api/customer-orders] 알 수 없는 오류 발생", e);
            // 최후의 보루: 그래도 화면이 죽지 않게 빈 리스트로 응답
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
