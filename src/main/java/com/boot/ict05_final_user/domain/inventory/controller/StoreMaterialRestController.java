package com.boot.ict05_final_user.domain.inventory.controller;

import com.boot.ict05_final_user.config.security.principal.AppUser;
import com.boot.ict05_final_user.domain.inventory.dto.StoreMaterialCreateDTO;
import com.boot.ict05_final_user.domain.inventory.dto.StoreMaterialResponse;
import com.boot.ict05_final_user.domain.inventory.service.StoreMaterialService;
import com.boot.ict05_final_user.domain.purchaseOrder.dto.PurchaseOrderRequestsDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 가맹점 재료 REST 컨트롤러
 *
 * <p>React 프런트엔드용 API</p>
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/API/store/material")
public class StoreMaterialRestController {

    private final StoreMaterialService storeMaterialService;

    /**
     * 가맹점 재료 등록
     *
     * POST /API/store/material
     *
     * {
     *   "storeId": 3,
     *   "hqMaterial": true,
     *   "materialId": 23,
     *   "code": null,
     *   "name": "양파",
     *   "category": "VEGETABLE",
     *   "baseUnit": "g",
     *   "salesUnit": "kg",
     *   "conversionRate": 1000,
     *   "optimalQuantity": 5000,
     *   "purchasePrice": 3200,
     *   "supplier": "신선마트",
     *   "temperature": "REFRIGERATE",
     *   "status": "USE"
     * }
     */
    @PostMapping
    public ResponseEntity<Long> createStoreMaterial(
            @Valid @RequestBody StoreMaterialCreateDTO dto,
            @AuthenticationPrincipal AppUser user
    ) {
        dto.setStoreId(user.getStoreId());
        Long id = storeMaterialService.create(dto);
        return ResponseEntity.ok(id);
    }

    /**
     * 가맹점 재료 목록 조회
     * GET /API/store/material/list?storeId=2
     */
    @GetMapping("/list")
    public List<StoreMaterialResponse> list(@AuthenticationPrincipal AppUser user) {
        return storeMaterialService.getStoreMaterials(user.getStoreId());
    }

    /**
     * 선택 매장에 본사 재료 일괄 매핑
     *
     * 예) POST /API/store/material/sync-hq?storeId=2
     *
     * @return 새로 생성된 StoreMaterial 개수
     */
    @PostMapping("/sync-hq")
    public int syncHqMaterials(@AuthenticationPrincipal AppUser user) {
        return storeMaterialService.mapAllHqMaterialsToStore(user.getStoreId());
    }

    /**
     * 가맹점 재고 초기 세팅
     * 예: POST /API/store/material/init-inventory?storeId=2
     */
    @PostMapping("/init-inventory")
    public ResponseEntity<Integer> initInventory(@AuthenticationPrincipal AppUser user) {
        int created = storeMaterialService.initStoreInventoryForStore(user.getStoreId());
        return ResponseEntity.ok(created);
    }
}
