package com.boot.ict05_final_user.domain.inventory.controller;

import com.boot.ict05_final_user.domain.inventory.dto.StoreMaterialCreateDTO;
import com.boot.ict05_final_user.domain.inventory.dto.StoreMaterialResponse;
import com.boot.ict05_final_user.domain.inventory.service.StoreMaterialService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<Long> createStoreMaterial(@Valid @RequestBody StoreMaterialCreateDTO dto) {
        Long id = storeMaterialService.create(dto);
        return ResponseEntity.ok(id);
    }



    /**
     * 가맹점 재료 목록 조회
     * GET /API/store/material/list?storeId=2
     */
    @GetMapping("/list")
    public List<StoreMaterialResponse> list(@RequestParam Long storeId) {
        return storeMaterialService.getStoreMaterials(storeId);
    }
}
