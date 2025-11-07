package com.boot.ict05_final_user.domain.purchaseOrder.repository;

import com.boot.ict05_final_user.domain.purchaseOrder.dto.*;
import com.boot.ict05_final_user.domain.purchaseOrder.entity.QPurchaseOrder;
import com.boot.ict05_final_user.domain.purchaseOrder.entity.QPurchaseOrderDetail;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Objects;

@Repository
@RequiredArgsConstructor
public class PurchaseOrderRepositoryImpl implements PurchaseOrderRepositoryCustom{

    private final JPAQueryFactory queryFactory;

    @Override
    public Page<PurchaseOrderListDTO> listPurchase(PurchaseOrderSearchDTO purchaseOrderSearchDTO, Pageable pageable) {
        QPurchaseOrder po = QPurchaseOrder.purchaseOrder;

        // 발주 데이터 목록 조회
        List<PurchaseOrderListDTO> content = queryFactory
                .select(Projections.fields(PurchaseOrderListDTO.class,
                        po.id,
                        po.orderCode,
                        po.supplier,
                        po.mainItemName,
                        po.itemCount,
                        po.totalPrice,
                        po.orderDate,
                        po.actualDeliveryDate,
                        po.priority,
                        po.status
                ))
                .from(po)
                .where(
                        eqOrderCode(purchaseOrderSearchDTO, po),
                        po.details.isNotEmpty()
                )
                .orderBy(po.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        // 전체 카운트 조회
        Long total = queryFactory
                .select(po.count())
                .from(po)
                .where(
                        eqOrderCode(purchaseOrderSearchDTO, po)
                )
                .fetchOne();

        return new PageImpl<>(content, pageable, total);
    }

    // 검색 필터
    private BooleanExpression eqOrderCode(PurchaseOrderSearchDTO dto, QPurchaseOrder po) {

        // BooleanExpression condition = null;
        // 기본값 true
        BooleanExpression condition = Expressions.asBoolean(true).isTrue();

        // 상태 필터
        if(dto.getPurchaseOrderStatus() != null) {
            condition = condition.and(po.status.eq(dto.getPurchaseOrderStatus()));
        }

        String type = dto.getType();
        String keyword = dto.getS();

        if (keyword == null || keyword.trim().isEmpty()) {
            return condition; // 상태만 필터링
        }

        if (type == null) type = "all";

        switch (type) {
            case "orderCode":
                condition = condition.and(po.orderCode.containsIgnoreCase(keyword));
                break;
            case "supplier":
                condition = condition.and(po.supplier.containsIgnoreCase(keyword));
                break;
            case "mainItemName":
                condition = condition.and(po.mainItemName.containsIgnoreCase(keyword));
                break;
            case "all":
            default:
                condition = condition.and(
                        po.orderCode.containsIgnoreCase(keyword)
                                .or(po.supplier.containsIgnoreCase(keyword))
                                .or(po.mainItemName.containsIgnoreCase(keyword))
                );
        }
        return condition;
    }

    // 리스트 개수 카운팅
    @Override
    public long countPurchase(PurchaseOrderSearchDTO purchaseOrderSearchDTO) {
        QPurchaseOrder purchaseOrder = QPurchaseOrder.purchaseOrder;

        long total = queryFactory
                .select(purchaseOrder.count())
                .from(purchaseOrder)
                .where(
                        eqOrderCode(purchaseOrderSearchDTO, purchaseOrder)
                )
                .fetchOne();

        return total;
    }

    // 발주 상세 조회
    @Override
    public PurchaseOrderDetailDTO findPurchaseOrderDetail(Long id) {
        QPurchaseOrder po = QPurchaseOrder.purchaseOrder;
        QPurchaseOrderDetail pod = QPurchaseOrderDetail.purchaseOrderDetail;
        // QMaterial material = QMaterial.material;

        // 메인 발주 정보
        PurchaseOrderDetailDTO header = queryFactory
                .select(Projections.fields(PurchaseOrderDetailDTO.class,
                        po.id,
                        po.orderCode.as("orderCode"),
                        po.supplier,
                        po.orderDate.as("orderDate"),
                        po.actualDeliveryDate.as("actualDeliveryDate"),
                        po.status,
                        po.priority,
                        po.remark.as("notes"),
                        po.totalPrice.as("totalPrice"),
                        po.itemCount.as("itemCount")
                ))
                .from(po)
                .where(po.id.eq(id))
                .fetchOne();

        if (header == null) return null;

        // 발주 상세 품목 리스트
        List<PurchaseOrderItemDTO> items = queryFactory
                .select(Projections.fields(PurchaseOrderItemDTO.class,
                        // material.name,
                        pod.id,
                        pod.count.as("count"),
                        pod.unitPrice.as("unitPrice"),
                        pod.totalPrice.as("totalPrice")
                ))
                .from(pod)
                // .leftJoin(material).on(material.id.eq(pod.material.id))
                .where(pod.purchaseOrder.id.eq(id))
                .fetch();

        System.out.println(
                queryFactory
                        .select(pod.count, pod.unitPrice, pod.totalPrice)
                        .from(pod)
                        .where(pod.purchaseOrder.id.eq(id))
                        .fetch()
        );
        System.out.println("✅ items: " + items);

        header.setItems(items);
        return header;
    }

    // 등록


    // 상세 수정
    @Override
    public void updatePurchaseOrder(Long id, PurchaseOrderRequestsDTO dto) {
        QPurchaseOrder po = QPurchaseOrder.purchaseOrder;
        QPurchaseOrderDetail pod = QPurchaseOrderDetail.purchaseOrderDetail;

        // 발주 마스터 수정
        queryFactory
                .update(po)
                .set(po.priority, dto.getPriority())
                .set(po.remark, dto.getNotes())
                .where(po.id.eq(id))
                .execute();

        // 기존 품목 목록 조회
        List<Long> existingIds = queryFactory
                .select(pod.id)
                .from(pod)
                .where(pod.purchaseOrder.id.eq(id))
                .fetch();

        // 요청 DTO의 품목 ID 목록
        List<Long> requestIds = dto.getItems().stream()
                .map(PurchaseOrderItemDTO::getId)
                .filter(Objects::nonNull)
                .toList();

        // 삭제 대상 (기존에 있었는데 요청에는 없는 ID)
        List<Long> deleteIds = existingIds.stream()
                .filter(existingId -> !requestIds.contains(existingId))
                .toList();

        if (!deleteIds.isEmpty()) {
            queryFactory
                    .delete(pod)
                    .where(pod.id.in(deleteIds))
                    .execute();
        }

        // 발주 품목 수정
        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            for (PurchaseOrderItemDTO item : dto.getItems()) {
                queryFactory
                        .update(pod)
                        .set(pod.count, item.getCount())
                        .set(pod.unitPrice, item.getUnitPrice())
                        .set(pod.totalPrice, item.getTotalPrice())
                        .where(pod.id.eq(item.getId()))
                        .execute();
            }
        }
    }

    // 발주 전체(헤더+품목) 삭제
    @Override
    public void deletePurchaseOrder(Long id) {
        QPurchaseOrder po = QPurchaseOrder.purchaseOrder;
        QPurchaseOrderDetail pod = QPurchaseOrderDetail.purchaseOrderDetail;

        // 1️존재 여부 검증
        Long exists = queryFactory
                .select(po.id.count())
                .from(po)
                .where(po.id.eq(id))
                .fetchOne();

        if (exists == null || exists == 0) {
            throw new IllegalArgumentException("존재하지 않는 발주 ID: " + id);
        }

        // 발주 상세 먼저 삭제 (FK 제약 보호)
        long deletedDetails = queryFactory.delete(pod)
                .where(pod.purchaseOrder.id.eq(id))
                .execute();

        // 발주 헤더 삭제
        long deletedHeader = queryFactory.delete(po)
                .where(po.id.eq(id))
                .execute();

        // 남은 품목 수 다시 계산
        Long remainingCount = queryFactory
                .select(pod.count())
                .from(pod)
                .where(pod.purchaseOrder.id.eq(id))
                .fetchOne();

        // 발주 테이블의 품목 수 업데이트
        queryFactory
                .update(po)
                .set(po.itemCount, remainingCount != null ? remainingCount.intValue() : 0)
                .where(po.id.eq(id))
                .execute();
    }

    // 발주 상세 품목 삭제
    @Override
    public void deletePurchaseOrderDetail(Long detailId) {
        QPurchaseOrderDetail pod = QPurchaseOrderDetail.purchaseOrderDetail;
        QPurchaseOrder po = QPurchaseOrder.purchaseOrder;

        // 1️⃣ 삭제할 상세의 발주 ID 조회
        Long orderId = queryFactory
                .select(pod.purchaseOrder.id)
                .from(pod)
                .where(pod.id.eq(detailId))
                .fetchOne();

        if (orderId == null) {
            throw new IllegalArgumentException("해당 발주 상세가 존재하지 않습니다. detailId=" + detailId);
        }

        // 2️⃣ 상세 행 삭제
        queryFactory
                .delete(pod)
                .where(pod.id.eq(detailId))
                .execute();

        // 3️⃣ 남은 상세 수 재계산
        Long remainingCount = queryFactory
                .select(pod.count())
                .from(pod)
                .where(pod.purchaseOrder.id.eq(orderId))
                .fetchOne();

        // 4️⃣ 남은 상세가 0개면 발주 헤더도 삭제
        if (remainingCount == null || remainingCount == 0) {
            queryFactory
                    .delete(po)
                    .where(po.id.eq(orderId))
                    .execute();
        } else {
            // 5️⃣ 아니면 품목 수만 갱신
            queryFactory
                    .update(po)
                    .set(po.itemCount, remainingCount.intValue())
                    .where(po.id.eq(orderId))
                    .execute();
        }
    }



}
