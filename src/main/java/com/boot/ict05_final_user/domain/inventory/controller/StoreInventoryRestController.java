package com.boot.ict05_final_user.domain.inventory.controller;

import com.boot.ict05_final_user.domain.inventory.dto.StoreInventoryListDTO;
import com.boot.ict05_final_user.domain.inventory.dto.StoreInventoryRestockRequest;
import com.boot.ict05_final_user.domain.inventory.dto.StoreInventoryRestockResponse;
import com.boot.ict05_final_user.domain.inventory.service.StoreInventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 가맹점 재고 REST 컨트롤러
 *
 * <p>재고 목록/입고/출고/조정 API 제공</p>
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/API/store/inventory")
public class StoreInventoryRestController {

    private final StoreInventoryService storeInventoryService;

    /**
     * 가맹점 재고 목록 조회
     * GET /API/store/inventory/list?storeId=2
     */
    @GetMapping("/list")
    public List<StoreInventoryListDTO> getStoreInventoryList(@RequestParam Long storeId) {
        return storeInventoryService.getStoreInventoryList(storeId);
    }

    /**
     * 가맹점 재고 0으로 일괄 생성
     * POST /API/store/inventory/init?storeId=2
     */
    @PostMapping("/init")
    public ResponseEntity<Integer> initInventory(@RequestParam Long storeId) {
        int created = storeInventoryService.initInventoryForStore(storeId);
        return ResponseEntity.ok(created);
    }

    /**
     * 가맹점 재고 입고
     *
     * POST /API/store/inventory/restock
     */
    @PostMapping("/restock")
    public ResponseEntity<Void> restock(@RequestBody @Valid StoreInventoryRestockRequest request) {
        storeInventoryService.restock(request);
        return ResponseEntity.ok().build();
    }
}
