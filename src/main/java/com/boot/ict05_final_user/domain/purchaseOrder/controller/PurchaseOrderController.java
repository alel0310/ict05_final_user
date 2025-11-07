package com.boot.ict05_final_user.domain.purchaseOrder.controller;

import com.boot.ict05_final_user.domain.purchaseOrder.dto.PurchaseOrderListDTO;
import com.boot.ict05_final_user.domain.purchaseOrder.dto.PurchaseOrderSearchDTO;
import com.boot.ict05_final_user.domain.purchaseOrder.service.PurchaseOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequiredArgsConstructor
@RequestMapping("/purchase")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;



    // 발주 등록 화면 표시


    // 발주 상세 내용 조회


    // 발주 상세 수정 화면 표시


}
