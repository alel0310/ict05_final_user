package com.boot.ict05_final_user.domain.purchaseOrder.service;

import com.boot.ict05_final_user.domain.purchaseOrder.dto.*;
import com.boot.ict05_final_user.domain.purchaseOrder.entity.PurchaseOrder;
import com.boot.ict05_final_user.domain.purchaseOrder.entity.PurchaseOrderDetail;
import com.boot.ict05_final_user.domain.purchaseOrder.repository.PurchaseOrderRepository;
import jakarta.transaction.Transactional;
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

    // 발주 상세 조회
    public PurchaseOrderDetailDTO getPurchaseOrderDetail(Long id) {
        return purchaseOrderRepository.findPurchaseOrderDetail(id);
    }

    // 발주 등록


    // 발주 수정
    @Transactional
    public void updatePurchaseOrder(Long id, PurchaseOrderRequestsDTO dto) {
        purchaseOrderRepository.updatePurchaseOrder(id, dto);
    }

    // 발주 전체(헤더+품목) 삭제
    @Transactional
    public void deletePurchaseOrder(Long id) {
        purchaseOrderRepository.deletePurchaseOrder(id);
    }

    // 발주 상세 품목 삭제
    @Transactional
    public void deletePurchaseOrderDetail(Long detailId) {
        purchaseOrderRepository.deletePurchaseOrderDetail(detailId);
    }

    // 발주 상태 전환


    // 발주 상단 요약 데이터 조회


    // 발주 목록 엑셀 다운로드



}
