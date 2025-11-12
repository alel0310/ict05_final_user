package com.boot.ict05_final_user.domain.purchaseOrder.repository;

import com.boot.ict05_final_user.domain.inventory.entity.QStoreMaterial;
import com.boot.ict05_final_user.domain.inventory.entity.StoreMaterial;
import com.boot.ict05_final_user.domain.purchaseOrder.dto.*;
import com.boot.ict05_final_user.domain.purchaseOrder.entity.PurchaseOrder;
import com.boot.ict05_final_user.domain.purchaseOrder.entity.PurchaseOrderStatus;
import com.boot.ict05_final_user.domain.purchaseOrder.entity.QPurchaseOrder;
import com.boot.ict05_final_user.domain.purchaseOrder.entity.QPurchaseOrderDetail;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
@Slf4j
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
                        eqOrderCode(purchaseOrderSearchDTO, po),
                        po.details.isNotEmpty()
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
        QStoreMaterial material = QStoreMaterial.storeMaterial;

        // 메인 발주 정보
        PurchaseOrderDetailDTO header = queryFactory
                .select(Projections.fields(PurchaseOrderDetailDTO.class,
                        po.id,
                        po.orderCode.as("orderCode"),
                        po.supplier,
                        po.orderDate.as("orderDate"),
                        po.actualDeliveryDate.as("actualDate"),
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
                        pod.id,
                        material.id.as("materialId"),
                        material.name.as("materialName"),
                        pod.count.as("count"),
                        pod.unitPrice.as("unitPrice"),
                        pod.totalPrice.as("totalPrice")
                ))
                .from(pod)
                .join(pod.material, material)
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
    @Override
    public long createPurchaseOrder(PurchaseOrderRequestsDTO dto) {

        QPurchaseOrder po = QPurchaseOrder.purchaseOrder;
        QPurchaseOrderDetail pod = QPurchaseOrderDetail.purchaseOrderDetail;
        QStoreMaterial material = QStoreMaterial.storeMaterial;

        // 1️⃣ 발주 코드 생성
        String orderCode = generateOrderCode();

        // 2️⃣ 첫 번째 품목 Material 정보 조회 (대표 품목 + 공급업체)
        Long firstMaterialId = dto.getItems().get(0).getMaterialId();
        StoreMaterial firstMaterialEntity = queryFactory
                .selectFrom(material)
                .where(material.id.eq(firstMaterialId))
                .fetchOne();

        if (firstMaterialEntity == null) {
            throw new IllegalArgumentException("첫 번째 품목 Material이 존재하지 않습니다. id=" + firstMaterialId);
        }

        // 3️⃣ 발주 헤더 insert
        PurchaseOrder purchaseOrder = PurchaseOrder.builder()
                .orderCode(orderCode)
                .supplier(firstMaterialEntity.getSupplier())
                .mainItemName(firstMaterialEntity.getName())
                .priority(dto.getPriority())
                .remark(dto.getNotes())
                .status(PurchaseOrderStatus.RECEIVED)
                .orderDate(LocalDate.now())
                .build();

        queryFactory.insert(po)
                .set(po.orderCode, purchaseOrder.getOrderCode())
                .set(po.supplier, purchaseOrder.getSupplier())
                .set(po.mainItemName, purchaseOrder.getMainItemName())
                .set(po.priority, purchaseOrder.getPriority())
                .set(po.remark, purchaseOrder.getRemark())
                .set(po.status, purchaseOrder.getStatus())
                .set(po.orderDate, purchaseOrder.getOrderDate())
                .execute();

        // 방금 insert한 발주 ID 조회
        Long purchaseOrderId = queryFactory
                .select(po.id.max())
                .from(po)
                .fetchOne();

        // 4️⃣ 발주 상세 품목 insert
        BigDecimal totalPrice = BigDecimal.ZERO;

        for (PurchaseOrderItemDTO itemDTO : dto.getItems()) {
            StoreMaterial m = queryFactory
                    .selectFrom(material)
                    .where(material.id.eq(itemDTO.getMaterialId()))
                    .fetchOne();

            if (m == null) throw new IllegalArgumentException("Material 없음 id=" + itemDTO.getMaterialId());

            BigDecimal itemTotal = m.getSellingPrice().multiply(BigDecimal.valueOf(itemDTO.getCount()));

            queryFactory.insert(pod)
                    .set(pod.purchaseOrder.id, purchaseOrderId)
                    .set(pod.material.id, m.getId())
                    .set(pod.unitPrice, m.getSellingPrice())
                    .set(pod.count, itemDTO.getCount())
                    .set(pod.totalPrice, itemTotal)
                    .execute();

            totalPrice = totalPrice.add(itemTotal);
        }

        // 5️⃣ 총 금액, 품목 수 업데이트
        int itemCount = dto.getItems().size();
        queryFactory.update(po)
                .set(po.totalPrice, totalPrice)
                .set(po.itemCount, itemCount)
                .where(po.id.eq(purchaseOrderId))
                .execute();

        return purchaseOrderId;
    }

    // 발주 코드 자동 생성
    private String generateOrderCode() {
        String prefix = "ORD";
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long random = (long) (Math.random() * 9000) + 1000; // 4자리 랜덤
        return prefix + datePart + random;
    }

    // 상세 수정
    @Override
    @Transactional
    public void updatePurchaseOrder(Long id, PurchaseOrderRequestsDTO dto) {
        QPurchaseOrder po = QPurchaseOrder.purchaseOrder;
        QPurchaseOrderDetail pod = QPurchaseOrderDetail.purchaseOrderDetail;
        QStoreMaterial material = QStoreMaterial.storeMaterial;

        // 0) 상태 가드: PENDING만 수정 허용
        PurchaseOrderStatus current = queryFactory
                .select(po.status)
                .from(po)
                .where(po.id.eq(id))
                .fetchOne();
        if (current == null) {
            throw new IllegalArgumentException("존재하지 않는 발주 ID: " + id);
        }
        if (current != PurchaseOrderStatus.PENDING) {
            // 컨트롤러에서 409로 매핑할 수 있게 런타임 예외 던짐
            throw new IllegalStateException("현재 상태(" + current + ")에서는 수정할 수 없습니다. 대기중 상태에서만 수정 가능합니다.");
        }

        // 1) 헤더 갱신
        queryFactory.update(po)
                .set(po.priority, dto.getPriority())
                .set(po.remark, dto.getNotes())
                .where(po.id.eq(id))
                .execute();

        List<PurchaseOrderItemDTO> items = Optional.ofNullable(dto.getItems()).orElse(List.of());

        // ✅ 요청이 비어있으면 상세는 그대로 두고 헤더 합계만 정합성 맞추고 종료
        if (items.isEmpty()) {
            recalcAndUpdateHeaderTotals(id, pod, po);
            return;
        }

        // 요청 materialId 세트 (0개/음수 필터 아웃)
        Set<Long> reqMaterialIds = items.stream()
                .map(PurchaseOrderItemDTO::getMaterialId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // 2) 삭제: 기존에 있었는데 요청에 없는 materialId는 삭제
        List<Long> existingMaterialIds = queryFactory
                .select(pod.material.id)
                .from(pod)
                .where(pod.purchaseOrder.id.eq(id))
                .fetch();

        List<Long> deleteByMids = existingMaterialIds.stream()
                .filter(mid -> !reqMaterialIds.contains(mid))
                .toList();

        if (!deleteByMids.isEmpty()) {
            queryFactory.delete(pod)
                    .where(pod.purchaseOrder.id.eq(id)
                            .and(pod.material.id.in(deleteByMids)))
                    .execute();
        }

        // 3) upsert: materialId 기준으로 수량/단가/총액 갱신, 없으면 삽입
        for (PurchaseOrderItemDTO item : items) {
            Long materialId = item.getMaterialId();
            if (materialId == null) continue;

            int count = Math.max(0, Optional.ofNullable(item.getCount()).orElse(0));

            BigDecimal unitPrice = queryFactory
                    .select(material.sellingPrice)
                    .from(material)
                    .where(material.id.eq(materialId))
                    .fetchOne();
            if (unitPrice == null) {
                throw new IllegalArgumentException("존재하지 않는 재료 ID: " + materialId);
            }
            BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(count));

            Long detailId = queryFactory
                    .select(pod.id)
                    .from(pod)
                    .where(pod.purchaseOrder.id.eq(id).and(pod.material.id.eq(materialId)))
                    .fetchOne();

            if (detailId != null) {
                queryFactory.update(pod)
                        .set(pod.count, count)
                        .set(pod.unitPrice, unitPrice)
                        .set(pod.totalPrice, totalPrice)
                        .where(pod.id.eq(detailId))
                        .execute();
            } else {
                queryFactory.insert(pod)
                        .columns(pod.purchaseOrder.id, pod.material.id, pod.count, pod.unitPrice, pod.totalPrice)
                        .values(id, materialId, count, unitPrice, totalPrice)
                        .execute();
            }
        }

        // 4) 합계 재계산 후 헤더 반영
        recalcAndUpdateHeaderTotals(id, pod, po);
    }

    // 합계 재계산 유틸
    private void recalcAndUpdateHeaderTotals(Long orderId, QPurchaseOrderDetail pod, QPurchaseOrder po) {
        Long itemCount = queryFactory
                .select(pod.count())
                .from(pod)
                .where(pod.purchaseOrder.id.eq(orderId))
                .fetchOne();

        BigDecimal totalAmount = queryFactory
                .select(pod.totalPrice.sum())
                .from(pod)
                .where(pod.purchaseOrder.id.eq(orderId))
                .fetchOne();

        queryFactory
                .update(po)
                .set(po.itemCount, itemCount != null ? itemCount.intValue() : 0)
                .set(po.totalPrice, totalAmount != null ? totalAmount : BigDecimal.ZERO)
                .where(po.id.eq(orderId))
                .execute();
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

        // 삭제할 상세의 발주 ID 조회
        Long orderId = queryFactory
                .select(pod.purchaseOrder.id)
                .from(pod)
                .where(pod.id.eq(detailId))
                .fetchOne();

        if (orderId == null) {
            throw new IllegalArgumentException("해당 발주 상세가 존재하지 않습니다. detailId=" + detailId);
        }

        // 상세 행 삭제
        queryFactory
                .delete(pod)
                .where(pod.id.eq(detailId))
                .execute();

        // 남은 상세 수 재계산
        Long remainingCount = queryFactory
                .select(pod.count())
                .from(pod)
                .where(pod.purchaseOrder.id.eq(orderId))
                .fetchOne();

        // 남은 상세가 0개면 발주 헤더도 삭제
        if (remainingCount == null || remainingCount == 0) {
            queryFactory
                    .delete(po)
                    .where(po.id.eq(orderId))
                    .execute();
        } else {
            // 아니면 품목 수만 갱신
            queryFactory
                    .update(po)
                    .set(po.itemCount, remainingCount.intValue())
                    .where(po.id.eq(orderId))
                    .execute();
        }
    }

    // 본사 상태 연동
    @Override
    public Optional<String> findOrderCodeById(Long id) {
        QPurchaseOrder po = QPurchaseOrder.purchaseOrder;

        String code = queryFactory
                .select(po.orderCode)
                .from(po)
                .where(po.id.eq(id))
                .fetchOne();

        return Optional.ofNullable(code);
    }



}
