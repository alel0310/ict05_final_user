package com.boot.ict05_final_user.domain.purchaseOrder.controller;

import com.boot.ict05_final_user.domain.purchaseOrder.dto.PurchaseOrderListDTO;
import com.boot.ict05_final_user.domain.purchaseOrder.dto.PurchaseOrderSearchDTO;
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
//@CrossOrigin(
//        origins = {"http://localhost:3000"}, // 운영/개발 도메인 맞춰서 교체
//        allowCredentials = "true"
//)
@Tag(name = "발주 API", description = "발주 등록/조회/수정 기능 제공")
@Slf4j
public class PurchaseOrderRestController {

    private final PurchaseOrderService purchaseOrderService;

    // 발주 목록 페이징 처리
    @GetMapping("/list")
    public ResponseEntity<Page<PurchaseOrderListDTO>> listPurchase(
            @ModelAttribute PurchaseOrderSearchDTO purchaseOrderSearchDTO,
            @PageableDefault(page = 0, size = 10, sort = "id", direction = Sort.Direction.DESC)
            Pageable pageable) {

        Page<PurchaseOrderListDTO> result = purchaseOrderService.selectAllPurchase(purchaseOrderSearchDTO, pageable);
        return ResponseEntity.ok(result);
    }

    // 발주 등록 API


    // 발주 수정 API


    // 발주 상태 변경, 조회


    // 발주 목록 엑셀 다운로드


    // 발주 상세 주문서 엑셀 다운로드



}
