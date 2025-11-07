package com.boot.ict05_final_user.domain.purchaseOrder.repository;

import com.boot.ict05_final_user.domain.purchaseOrder.dto.PurchaseOrderListDTO;
import com.boot.ict05_final_user.domain.purchaseOrder.dto.PurchaseOrderSearchDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PurchaseOrderRepositoryCustom {

    // 발주 목록 조회
    Page<PurchaseOrderListDTO> listPurchase(PurchaseOrderSearchDTO purchaseOrderSearchDTO, Pageable pageable);
    // 발주 총 개수
    long countPurchase(PurchaseOrderSearchDTO purchaseOrderSearchDTO);
    // 발주 등록

    // 발주 상세 조회

    // 발주 상세 - 주문 상품 리스트

    // 발주 수정

    // 상단 카드 데이터


}
