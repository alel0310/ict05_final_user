package com.boot.ict05_final_user.domain.order.repository;

import com.boot.ict05_final_user.domain.order.dto.CustomerOrderSearchDTO;
import com.boot.ict05_final_user.domain.order.entity.CustomerOrder;
import com.boot.ict05_final_user.domain.order.entity.QCustomerOrder;
import com.boot.ict05_final_user.domain.order.entity.QCustomerOrderDetail;
import com.boot.ict05_final_user.domain.menu.entity.QMenu;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class CustomerOrderRepositoryImpl implements CustomerOrderRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Page<CustomerOrder> searchOrders(Long storeId, CustomerOrderSearchDTO cond, Pageable pageable) {
        QCustomerOrder order = QCustomerOrder.customerOrder;
        QCustomerOrderDetail detail = QCustomerOrderDetail.customerOrderDetail;
        QMenu menu = QMenu.menu;

        if (cond == null) cond = new CustomerOrderSearchDTO();

        BooleanExpression where = order.store.id.eq(storeId);

        // 기간 필터
        where = where.and(buildPeriodExpr(order, cond.getPeriod()));

        // 상태 필터
        if (StringUtils.hasText(cond.getStatus()) && !"all".equalsIgnoreCase(cond.getStatus())) {
            where = where.and(order.status.stringValue()
                    .eq(cond.getStatus().toUpperCase()));
        }

        // 결제 방법 필터
        if (StringUtils.hasText(cond.getPaymentType()) && !"all".equals(cond.getPaymentType())) {
            where = where.and(order.paymentType.stringValue()
                    .eq(cond.getPaymentType().toUpperCase()));
        }

        // 주문 유형 필터
        if (StringUtils.hasText(cond.getOrderType()) && !"all".equals(cond.getOrderType())) {
            where = where.and(order.orderType.stringValue()
                    .eq(cond.getOrderType().toUpperCase()));
        }

        // 키워드: 주문코드 / 고객명 / 전화번호 / 메뉴명
        if (StringUtils.hasText(cond.getKeyword())) {
            String kw = cond.getKeyword().trim();

            BooleanExpression inOrder =
                    order.orderCode.containsIgnoreCase(kw)
                            .or(order.memo.containsIgnoreCase(kw))
                            .or(order.customerPhone.containsIgnoreCase(kw));

            BooleanExpression inMenu =
                    menu.menuName.containsIgnoreCase(kw);

            where = where.and(
                    inOrder.or(order.id.in(
                            queryFactory.select(detail.order.id)
                                    .from(detail)
                                    .leftJoin(detail.menuIdFk, menu)
                                    .where(inMenu)
                    ))
            );
        }

        // 정렬(최신 주문 먼저)
        Sort sort = pageable.getSort().isUnsorted()
                ? Sort.by(Sort.Direction.DESC, "id")
                : pageable.getSort();

        // 실제 조회
        List<CustomerOrder> content = queryFactory
                .selectFrom(order)
                .where(where)
                .orderBy(sort.getOrderFor("id").isAscending()
                        ? order.id.asc()
                        : order.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        Long total = queryFactory
                .select(order.id.count())
                .from(order)
                .where(where)
                .fetchOne();

        return new PageImpl<>(content, pageable, total != null ? total : 0L);
    }

    private BooleanExpression buildPeriodExpr(QCustomerOrder order, String period) {
        LocalDate today = LocalDate.now();

        if (!StringUtils.hasText(period) || "all".equalsIgnoreCase(period)) {
            return null;    // 기간 필터 없음
        }

        LocalDateTime start;
        LocalDateTime end = today.plusDays(1).atStartOfDay();

        switch (period) {
            case "today" -> start = today.atStartOfDay();
            case "week" -> start = today.minusDays(6).atStartOfDay();
            case "month" -> start = today.withDayOfMonth(1).atStartOfDay();
            default -> { return null; }
        }

        return order.orderedAt.between(start, end);
    }
}