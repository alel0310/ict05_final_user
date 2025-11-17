package com.boot.ict05_final_user.domain.inventory.controller;

import com.boot.ict05_final_user.domain.material.dto.StoreMaterialCreateDTO;
import com.boot.ict05_final_user.domain.material.service.StoreMaterialService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 가맹점 재료 REST 컨트롤러
 *
 * <p>React 프런트엔드용 API</p>
 */
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
}
