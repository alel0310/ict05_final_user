package com.boot.ict05_final_user.domain.order.controller;

import com.boot.ict05_final_user.domain.order.dto.CreateOrderRequestDTO;
import com.boot.ict05_final_user.domain.order.dto.CreateOrderResponseDTO;
import com.boot.ict05_final_user.domain.order.dto.UpdateStatusRequestDTO;
import com.boot.ict05_final_user.domain.order.entity.CustomerOrder;
import com.boot.ict05_final_user.domain.order.service.CustomerOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/customer-orders")//api/customer-orders
public class CustomerOrderController {

    private final CustomerOrderService orderService;

    @PostMapping
    public ResponseEntity<CreateOrderResponseDTO> create(@RequestBody CreateOrderRequestDTO req) {
        return ResponseEntity.ok(orderService.create(req));
    }

    // 주방: 진행중(준비중/완료대기)만
    @GetMapping
    public ResponseEntity<List<CustomerOrder>> listForKitchen() {
        return ResponseEntity.ok(orderService.findForKitchen());
    }

    @PatchMapping("/{orderId}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable Long orderId,
                                             @RequestBody UpdateStatusRequestDTO body) {
        orderService.updateStatus(orderId, body.getStatus());
        return ResponseEntity.noContent().build();
    }
}
