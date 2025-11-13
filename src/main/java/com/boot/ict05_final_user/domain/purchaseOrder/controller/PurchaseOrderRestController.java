package com.boot.ict05_final_user.domain.purchaseOrder.controller;

import com.boot.ict05_final_user.domain.purchaseOrder.dto.PurchaseOrderDetailDTO;
import com.boot.ict05_final_user.domain.purchaseOrder.dto.PurchaseOrderListDTO;
import com.boot.ict05_final_user.domain.purchaseOrder.dto.PurchaseOrderRequestsDTO;
import com.boot.ict05_final_user.domain.purchaseOrder.dto.PurchaseOrderSearchDTO;
import com.boot.ict05_final_user.domain.purchaseOrder.entity.PurchaseOrderStatus;
import com.boot.ict05_final_user.domain.purchaseOrder.repository.PurchaseOrderRepository;
import com.boot.ict05_final_user.domain.purchaseOrder.service.OrderSyncService;
import com.boot.ict05_final_user.domain.purchaseOrder.service.PurchaseOrderService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/purchase")
@Tag(name = "발주 API", description = "발주 등록/조회/수정 기능 제공")
@Slf4j
public class PurchaseOrderRestController {

    private final PurchaseOrderService purchaseOrderService;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final OrderSyncService orderSyncService;

    // 발주 목록 페이징 처리
    @GetMapping("/list")
    public ResponseEntity<Page<PurchaseOrderListDTO>> listPurchase(
            @ModelAttribute PurchaseOrderSearchDTO purchaseOrderSearchDTO,
            @RequestParam(value = "status", required = false) PurchaseOrderStatus status,
            @PageableDefault(page = 0, size = 10, sort = "id", direction = Sort.Direction.DESC)
            Pageable pageable) {

        if (status != null) purchaseOrderSearchDTO.setPurchaseOrderStatus(status);
        Page<PurchaseOrderListDTO> result = purchaseOrderService.selectAllPurchase(purchaseOrderSearchDTO, pageable);
        return ResponseEntity.ok(result);
    }

    // 발주 상세 API
    @GetMapping("/detail/{id}")
    public ResponseEntity<PurchaseOrderDetailDTO> getPurchaseOrderDetail(@PathVariable Long id) {
        PurchaseOrderDetailDTO detail = purchaseOrderService.getPurchaseOrderDetail(id);
        return ResponseEntity.ok(detail);
    }

    // 발주 등록 API
    @PostMapping("/create")
    public ResponseEntity<Long> createPurchaseOrder(@RequestBody PurchaseOrderRequestsDTO dto) {
        log.info("발주 등록 요청 들어옴: {}", dto);
        Long newOrderId = purchaseOrderService.createPurchaseOrder(dto);
        return ResponseEntity.ok(newOrderId);
    }

    // 발주 수정 API
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePurchaseOrder(
            @PathVariable Long id,
            @Valid @RequestBody PurchaseOrderRequestsDTO dto) {
        log.info("PUT 요청 들어옴 id={}", id);
        log.info(dto.getItems().toString());
        purchaseOrderService.updatePurchaseOrder(id, dto);
        return ResponseEntity.ok().build();
    }

    // 발주 전체(헤더+품목) 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePurchaseOrder(@PathVariable Long id) {
        purchaseOrderService.deletePurchaseOrder(id);
        return ResponseEntity.noContent().build(); // 204 응답
    }

    // 발주 상세 품목 삭제
    @DeleteMapping("/detail/item/{detailId}")
    public ResponseEntity<?> deletePurchaseOrderDetail(@PathVariable Long detailId) {
        purchaseOrderService.deletePurchaseOrderDetail(detailId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 가맹점 발주 상태 변경
     *
     * <p>가맹점에서 배송상태(PENDING → RECEIVED → DELIVERED 등)를 직접 변경할 때 호출한다.<br>
     * 상태 변경 후 본사 서버에 동기화 요청도 자동 수행한다.</p>
     *
     * @param id     변경할 발주 ID
     * @param status 새 상태
     */
    @PutMapping("/status/{id}")
    public ResponseEntity<?> updatePurchaseStatus(
            @PathVariable Long id,
            @RequestParam("status") String status
    ) {
        try {
            PurchaseOrderStatus newStatus = PurchaseOrderStatus.valueOf(status.toUpperCase());
            purchaseOrderService.updateStatusById(id, newStatus);   // 로컬 DB 반영
            log.info("[STORE] 로컬 DB 상태 업데이트 완료: id={}, status={}", id, newStatus);

            // 3️⃣ HQ 동기화 (백엔드 → 백엔드)
            purchaseOrderRepository.findOrderCodeById(id).ifPresent(orderCode -> {
                try {
                    orderSyncService.syncToHQ(orderCode, newStatus.name());
                    log.info("[STORE] HQ 동기화 성공: orderCode={}, status={}", orderCode, newStatus);
                } catch (Exception e) {
                    // HQ 서버 미응답, 네트워크 오류, 인증 실패 등
                    log.warn("[STORE] HQ 동기화 실패: orderCode={}, status={}, err={}", orderCode, newStatus, e.getMessage());
                }
            });
            return ResponseEntity.ok("상태 변경 및 본사 동기화 완료");

        } catch (IllegalArgumentException e) {
            log.error("[STORE] 잘못된 상태 요청: {}", status);
            return ResponseEntity.badRequest().body("잘못된 상태 값: " + status);

        } catch (Exception e) {
            log.error("[STORE] 상태 변경 중 예외 발생: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("상태 변경 중 서버 오류 발생");
        }
    }


    // 본사와 상태 연동
    @PutMapping("/sync/status")
    public ResponseEntity<?> syncStatusFromHQ(
            @RequestParam("orderCode") String orderCode,
            @RequestParam("status") String status
    ) {
        log.info("[STORE] 본사로부터 동기화 요청 수신: orderCode={}, status={}", orderCode, status);
        try {
            PurchaseOrderStatus newStatus = PurchaseOrderStatus.valueOf(status.toUpperCase());
            purchaseOrderService.updateStatusByOrderCode(orderCode, newStatus); // 로컬 DB 반영
            return ResponseEntity.ok("가맹점 상태 동기화 완료");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("잘못된 상태 값: " + status);
        }
    }


}
