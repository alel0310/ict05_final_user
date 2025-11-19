package com.boot.ict05_final_user.domain.inventory.controller;

import com.boot.ict05_final_user.config.security.principal.AppUser;
import com.boot.ict05_final_user.domain.inventory.dto.*;
import com.boot.ict05_final_user.domain.inventory.service.StoreAdjustmentService;
import com.boot.ict05_final_user.domain.inventory.service.StoreConsumptionService;
import com.boot.ict05_final_user.domain.inventory.service.StoreInboundService;
import com.boot.ict05_final_user.domain.inventory.service.StoreInventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 가맹점 재고 REST 컨트롤러
 *
 * 재고 목록 입고 소진 조정 API 제공
 * 인증 컨텍스트의 AppUser에서 storeId를 읽어 사용
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/API/store/inventory")
public class StoreInventoryRestController {

    private final StoreInventoryService storeInventoryService;
    private final StoreInboundService inboundService;
    private final StoreConsumptionService consumptionService;
    private final StoreAdjustmentService adjustmentService;

    /**
     * 가맹점 재고 목록 조회
     * GET /API/store/inventory/list
     */
    @GetMapping("/list")
    public List<StoreInventoryListDTO> getStoreInventoryList(@AuthenticationPrincipal AppUser user) {
        return storeInventoryService.getStoreInventoryList(user.getStoreId());
    }

    /**
     * 가맹점 재고 0으로 일괄 생성
     * POST /API/store/inventory/init
     */
    @PostMapping("/init")
    public ResponseEntity<Integer> initInventory(@AuthenticationPrincipal AppUser user) {
        int created = storeInventoryService.initInventoryForStore(user.getStoreId());
        return ResponseEntity.ok(created);
    }

    /**
     * 기존 재고 입고 API
     * POST /API/store/inventory/restock
     * 유지
     */
    @PostMapping("/restock")
    public ResponseEntity<Void> restock(@RequestBody @Valid StoreInventoryRestockRequest request) {
        storeInventoryService.restock(request);
        return ResponseEntity.ok().build();
    }

    /**
     * 신규 재입고 등록
     * 프론트 재입고 폼 전용
     * POST /API/store/inventory/in
     */
    @PostMapping("/in")
    public ResponseEntity<Long> inbound(@AuthenticationPrincipal AppUser user,
                                        @RequestBody @Valid StoreInventoryInWriteDTO dto) {
        Long id = inboundService.inbound(user.getStoreId(), dto);
        return ResponseEntity.ok(id);
    }

    /**
     * 판매 소진 처리
     * 레시피 기반과 직접 소진을 모두 지원
     * POST /API/store/inventory/consume
     */
    @PostMapping("/consume")
    public ResponseEntity<Void> consume(@AuthenticationPrincipal AppUser user,
                                        @RequestBody @Valid StoreConsumeRequestDTO dto) {
        consumptionService.consume(user.getStoreId(), dto);
        return ResponseEntity.ok().build();
    }

    /**
     * 재고 조정 처리
     * POST /API/store/inventory/adjust
     */
    @PostMapping("/adjust")
    public ResponseEntity<Void> adjust(@AuthenticationPrincipal AppUser user,
                                       @RequestBody @Valid StoreInventoryAdjustmentWriteDTO dto) {
        adjustmentService.adjust(user.getStoreId(), dto);
        return ResponseEntity.ok().build();
    }
}
