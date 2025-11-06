package com.boot.ict05_final_user.domain.purchaseOrder.service;

import com.boot.ict05_final_user.domain.purchaseOrder.dto.PurchaseOrderListDTO;
import com.boot.ict05_final_user.domain.purchaseOrder.dto.PurchaseOrderSearchDTO;
import com.boot.ict05_final_user.domain.purchaseOrder.repository.PurchaseOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
@Slf4j
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;

    // 발주 목록 페이지 단위 조회
    public Page<PurchaseOrderListDTO> selectAllPurchase(PurchaseOrderSearchDTO purchaseOrderSearchDTO, Pageable pageable) {
        return purchaseOrderRepository.listPurchase(purchaseOrderSearchDTO, pageable);
    }

    // 발주 등록


    // 발주 상세 조회


    // 발주 수정


    // 발주 상태 전환


    // 발주 상단 요약 데이터 조회


    // 발주 목록 엑셀 다운로드



}
