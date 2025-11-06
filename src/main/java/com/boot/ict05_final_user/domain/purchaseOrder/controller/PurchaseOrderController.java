package com.boot.ict05_final_user.domain.purchaseOrder.controller;

import com.boot.ict05_final_user.domain.purchaseOrder.service.PurchaseOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequiredArgsConstructor
@RequestMapping("/purchase")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    // 발주 등록 화면 표시


    // 발주 목록 페이징 처리 ( + 상태필터, 상단 카드 데이터)


    // 발주 상세 내용 조회


    // 발주 상세 수정 화면 표시


}
