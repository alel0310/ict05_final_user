package com.boot.ict05_final_user.domain.dailyClosing.repository;

import com.boot.ict05_final_user.domain.dailyClosing.entity.DailyClosing;
import com.boot.ict05_final_user.domain.dailyClosing.entity.DailyClosingDenom;
import com.boot.ict05_final_user.domain.dailyClosing.entity.DailyClosingExpense;
import com.boot.ict05_final_user.domain.dailyClosing.entity.QDailyClosingDenom;
import com.boot.ict05_final_user.domain.dailyClosing.entity.QDailyClosingExpense;
import com.boot.ict05_final_user.domain.order.entity.OrderStatus;
import com.boot.ict05_final_user.domain.order.entity.OrderType;
import com.boot.ict05_final_user.domain.order.entity.PaymentType;
import com.boot.ict05_final_user.domain.order.entity.QCustomerOrder;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DailyClosingRepositoryCustom 구현체.
 * Querydsl 을 사용하여 커스텀 쿼리를 수행한다.
 */
@Repository
@RequiredArgsConstructor
public class DailyClosingRepositoryImpl implements DailyClosingRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public OrderDailySummary getOrderDailySummary(Long storeId, LocalDate date) {

        QCustomerOrder order = QCustomerOrder.customerOrder;

        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay();

        // 공통 where 조건: 점포, 상태, 날짜
        Long countAll = queryFactory
                .select(order.id.count())
                .from(order)
                .where(
                        order.store.id.eq(storeId),
                        order.orderedAt.goe(start),
                        order.orderedAt.lt(end)
                )
                .fetchOne();

        System.out.println("[DailyClosing] storeId=" + storeId
                + ", date=" + date
                + ", ordersToday=" + countAll);

        // 매출 합계는 결제완료 상태 기준으로 집계
        long cashVisit   = sumOrderTotal(storeId, start, end, OrderType.VISIT,   PaymentType.CASH,   OrderStatus.COMPLETED);
        long cashTakeout = sumOrderTotal(storeId, start, end, OrderType.TAKEOUT, PaymentType.CASH,   OrderStatus.COMPLETED);
        long cashDelivery= sumOrderTotal(storeId, start, end, OrderType.DELIVERY,PaymentType.CASH,   OrderStatus.COMPLETED);

        long cardVisit   = sumOrderTotal(storeId, start, end, OrderType.VISIT,   PaymentType.CARD,   OrderStatus.COMPLETED);
        long cardTakeout = sumOrderTotal(storeId, start, end, OrderType.TAKEOUT, PaymentType.CARD,   OrderStatus.COMPLETED);
        long cardDelivery= sumOrderTotal(storeId, start, end, OrderType.DELIVERY,PaymentType.CARD,   OrderStatus.COMPLETED);

        long voucherTotal = sumOrderTotal(storeId, start, end, null, PaymentType.VOUCHER,OrderStatus.COMPLETED);

//        long totalDiscount = sumDiscount(storeId, start, end);
//        long totalRefund = sumRefund(storeId, start, end);   // REFUNDED 만 따로 합산
        long totalDiscount = 0L; // 할인/환불은 아직 안 쓰면 0으로 둬도 됨
        long totalRefund   = 0L;

        return new OrderDailySummary(
                cashVisit, cashTakeout, cashDelivery,
                cardVisit, cardTakeout, cardDelivery,
                voucherTotal, totalDiscount, totalRefund
        );
    }

    /**
     * 주문 합계를 계산하는 헬퍼 메서드.
     *
     * @param storeId   가맹점 ID
     * @param start     조회 시작 일시(포함)
     * @param end       조회 종료 일시(미포함)
     * @param orderType 주문 유형 (VISIT/TAKEOUT/DELIVERY). null 이면 전체.
     * @param paymentType 결제 수단 (CARD/CASH/VOUCHER)
     * @param status    주문 상태 (예: COMPLETED)
     * @return 조건에 해당하는 주문 총금액 합계(원 단위)
     */
    private long sumOrderTotal(
            Long storeId,
            LocalDateTime start,
            LocalDateTime end,
            OrderType orderType,
            PaymentType paymentType,
            OrderStatus ignoredStatus) {
        QCustomerOrder order = QCustomerOrder.customerOrder;

        BooleanExpression cond = order.store.id.eq(storeId)
                .and(order.status.notIn(OrderStatus.CANCELED, OrderStatus.REFUNDED))
                .and(order.paymentType.eq(paymentType))
                .and(order.orderedAt.goe(start))
                .and(order.orderedAt.lt(end));

        if (orderType != null) {
            cond = cond.and(order.orderType.eq(orderType));
        }

        BigDecimal sum = queryFactory
                .select(order.totalPrice.sum())
                .from(order)
                .where(cond)
                .fetchOne();

        return (sum != null) ? sum.longValue() : 0L;
    }

    /**
     * 상품권 매출 합계
     */
    private long sumVoucherTotal(Long storeId,
                                 LocalDateTime start,
                                 LocalDateTime end) {

        QCustomerOrder order = QCustomerOrder.customerOrder;

        BigDecimal result = queryFactory
                .select(order.totalPrice.sum())
                .from(order)
                .where(
                        order.store.id.eq(storeId),
                        order.orderedAt.goe(start),
                        order.orderedAt.lt(end),
                        order.paymentType.eq(PaymentType.VOUCHER),
                        order.status.in(OrderStatus.PAID, OrderStatus.COMPLETED)
                )
                .fetchOne();

        if (result == null) {
            return 0L;
        }
        return result.longValue();
    }

    /**
     * 할인 합계
     * 할인 금액은 discount 필드 합으로 계산
     */
    private long sumDiscount(Long storeId,
                             LocalDateTime start,
                             LocalDateTime end) {

        QCustomerOrder order = QCustomerOrder.customerOrder;

        BigDecimal result = queryFactory
                .select(order.discount.sum())
                .from(order)
                .where(
                        order.store.id.eq(storeId),
                        order.orderedAt.goe(start),
                        order.orderedAt.lt(end),
                        order.status.in(OrderStatus.PAID, OrderStatus.COMPLETED)
                )
                .fetchOne();

        if (result == null) {
            return 0L;
        }
        return result.longValue();
    }

    /**
     * 환불 합계
     * 현재는 상태가 REFUNDED 인 주문의 totalPrice 합으로 계산
     * 추측입니다. 나중에 환불 로직 확정되면 조정해야 합니다.
     */
    private long sumRefund(Long storeId,
                           LocalDateTime start,
                           LocalDateTime end) {

        QCustomerOrder order = QCustomerOrder.customerOrder;

        BigDecimal result = queryFactory
                .select(order.totalPrice.sum())
                .from(order)
                .where(
                        order.store.id.eq(storeId),
                        order.orderedAt.goe(start),
                        order.orderedAt.lt(end),
                        order.status.eq(OrderStatus.REFUNDED)
                )
                .fetchOne();

        if (result == null) {
            return 0L;
        }
        return result.longValue();
    }

    // 지출 조회
    @Override
    public List<DailyClosingExpense> findExpensesByClosing(DailyClosing closing) {
        QDailyClosingExpense expense = QDailyClosingExpense.dailyClosingExpense;

        return queryFactory
                .selectFrom(expense)
                .where(expense.closing.eq(closing))
                .orderBy(expense.sortOrder.asc(), expense.id.asc())
                .fetch();
    }

    // 권종 조회
    @Override
    public List<DailyClosingDenom> findDenomsByClosing(DailyClosing closing) {
        QDailyClosingDenom denom = QDailyClosingDenom.dailyClosingDenom;

        return queryFactory
                .selectFrom(denom)
                .where(denom.closing.eq(closing))
                .orderBy(denom.denomValue.desc(), denom.id.asc())
                .fetch();
    }
}
