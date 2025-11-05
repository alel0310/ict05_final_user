package com.boot.ict05_final_user.domain.purchaseOrder.controller;

import com.boot.ict05_final_user.domain.purchaseOrder.service.PurchaseOrderService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/API")
@Tag(name = "발주 API", description = "발주 등록/조회/수정 기능 제공")
@Slf4j
public class PurchaseOrderRestController {

    private final PurchaseOrderService purchaseOrderService;

    // 발주 등록 API


    // 발주 수정 API


    // 발주 상태 변경, 조회


    // 발주 목록 엑셀 다운로드


    // 발주 상세 주문서 엑셀 다운로드



}
