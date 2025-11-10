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
            @PageableDefault(page = 0, size = 10, sort = "id", direction = Sort.Direction.DESC)
            Pageable pageable) {

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
//    @PostMapping
//    public ResponseEntity<Long> createPurchaseOrder(@RequestBody PurchaseOrderRequestsDTO dto) {
//        log.info("발주 등록 요청 들어옴: {}", dto);
//        Long newOrderId = purchaseOrderService.createPurchaseOrder(dto);
//        return ResponseEntity.ok(newOrderId);
//    }

    // 발주 수정 API
//    @PutMapping("/{id}")
//    public ResponseEntity<?> updatePurchaseOrder(
//            @PathVariable Long id,
//            @RequestBody PurchaseOrderRequestsDTO dto) {
//        log.info("PUT 요청 들어옴 id={}", id);
//        log.info(dto.getItems().toString());
//        purchaseOrderService.updatePurchaseOrder(id, dto);
//        return ResponseEntity.ok().build();
//    }

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
            // 1️⃣ 가맹점 DB에 상태 반영
            PurchaseOrderStatus newStatus = PurchaseOrderStatus.valueOf(status.toUpperCase());
            purchaseOrderService.updateStatusById(id, newStatus);

            // 2️⃣ 발주 코드 조회
            String orderCode = purchaseOrderRepository.findOrderCodeById(id)
                    .orElseThrow(() -> new IllegalArgumentException("해당 발주를 찾을 수 없습니다. ID=" + id));

            // 3️⃣ 본사로 상태 동기화
            orderSyncService.syncToHQ(orderCode, newStatus.name());

            log.info("✅ [STORE] 상태 변경 및 본사 동기화 완료: {} → {}", orderCode, newStatus);
            return ResponseEntity.ok("상태 변경 및 본사 동기화 완료");

        } catch (IllegalArgumentException e) {
            log.warn("⚠️ 잘못된 상태 값: {}", status);
            return ResponseEntity.badRequest().body("잘못된 상태 값입니다: " + status);
        } catch (Exception e) {
            log.error("🚨 상태 변경 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("상태 변경 중 오류가 발생했습니다.");
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
            purchaseOrderService.updateStatusByOrderCode(orderCode, newStatus);
            return ResponseEntity.ok("가맹점 상태 동기화 완료");
        } catch (IllegalArgumentException e) {
            log.error("❌ [STORE] 상태 변환 실패: {}", status);
            return ResponseEntity.badRequest().body("잘못된 상태 값: " + status);
        }
    }

    // 발주 목록 엑셀 다운로드


    // 발주 상세 주문서 엑셀 다운로드



}
