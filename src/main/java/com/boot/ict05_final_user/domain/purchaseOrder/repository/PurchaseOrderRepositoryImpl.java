package com.boot.ict05_final_user.domain.purchaseOrder.repository;

import com.boot.ict05_final_user.domain.purchaseOrder.dto.PurchaseOrderListDTO;
import com.boot.ict05_final_user.domain.purchaseOrder.dto.PurchaseOrderSearchDTO;
import com.boot.ict05_final_user.domain.purchaseOrder.entity.QPurchaseOrder;
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
        long total = queryFactory
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

    // 등록
}
