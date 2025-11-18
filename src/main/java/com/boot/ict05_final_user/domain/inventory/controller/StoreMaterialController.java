package com.boot.ict05_final_user.domain.inventory.controller;

import com.boot.ict05_final_user.domain.inventory.service.StoreMaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/api/store-material")
public class StoreMaterialController {

    private final StoreMaterialService storeMaterialService;

    @PostMapping("/hq-mapping/{storeId}")
    public ResponseEntity<Map<String, Object>> bulkMapHqMaterials(
            @PathVariable Long storeId
    ) {
        int created = storeMaterialService.mapAllHqMaterialsToStore(storeId);

        Map<String, Object> body = new HashMap<>();
        body.put("created", created);

        return ResponseEntity.ok(body);
    }
}
