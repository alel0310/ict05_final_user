package com.boot.ict05_final_user.domain.inventory.controller;

import com.boot.ict05_final_user.domain.inventory.dto.StoreInventoryListDTO;
import com.boot.ict05_final_user.domain.inventory.service.StoreInventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 가맹점 재고 REST 컨트롤러
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
}
