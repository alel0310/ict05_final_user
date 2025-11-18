package com.boot.ict05_final_user.domain.kitchen.controller;

import com.boot.ict05_final_user.config.security.principal.AppUser;
import com.boot.ict05_final_user.domain.kitchen.dto.KitchenOrderResponseDTO;
import com.boot.ict05_final_user.domain.kitchen.dto.UpdateKitchenOrderStatusRequestDTO;
import com.boot.ict05_final_user.domain.kitchen.service.KitchenOrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/kitchen-orders")
public class KitchenOrderController {

    private final KitchenOrderService kitchenOrderService;

    /**
     * 주방 화면 주문 목록
     *  GET /api/kitchen-orders?storeId=1
     */
    @GetMapping
    public ResponseEntity<List<KitchenOrderResponseDTO>> getKitchenOrders(
            @AuthenticationPrincipal AppUser user
    ) {
        Long storeId = user.getStoreId();              // ✅ 로그인한 점포 ID
        log.info("[Kitchen] getKitchenOrders storeId={}", storeId);

        List<KitchenOrderResponseDTO> orders = kitchenOrderService.getKitchenOrders(storeId);
        log.info("[Kitchen] result size={}", orders.size());

        return ResponseEntity.ok(orders);
    }

    /**
     * 상태 변경
     *  PATCH /api/kitchen-orders/{orderId}/status
     *  body: { "status": "cooking" }
     */
    @PatchMapping("/{orderId}/status")
    public ResponseEntity<KitchenOrderResponseDTO> updateStatus(
            @PathVariable Long orderId,
            @RequestBody UpdateKitchenOrderStatusRequestDTO req
    ) {
        KitchenOrderResponseDTO dto = kitchenOrderService.updateStatus(orderId, req);
        return ResponseEntity.ok(dto);
    }
}

