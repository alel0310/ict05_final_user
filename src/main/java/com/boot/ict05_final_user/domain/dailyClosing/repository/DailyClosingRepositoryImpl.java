package com.boot.ict05_final_user.domain.dailyClosing.repository;

import com.boot.ict05_final_user.domain.dailyClosing.entity.DailyClosing;
import com.boot.ict05_final_user.domain.dailyClosing.entity.DailyClosingDenom;
import com.boot.ict05_final_user.domain.dailyClosing.entity.DailyClosingExpense;
import com.boot.ict05_final_user.domain.dailyClosing.entity.QDailyClosingDenom;
import com.boot.ict05_final_user.domain.dailyClosing.entity.QDailyClosingExpense;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
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
        // TODO: 실제 주문 집계 쿼리는 나중에 구현
        // 현재는 화면 개발을 위해 0 으로 채워진 기본 값만 반환한다.
        return OrderDailySummary.empty();
    }

    @Override
    public List<DailyClosingExpense> findExpensesByClosing(DailyClosing closing) {
        QDailyClosingExpense expense = QDailyClosingExpense.dailyClosingExpense;

        return queryFactory
                .selectFrom(expense)
                .where(expense.closing.eq(closing))
                .orderBy(expense.sortOrder.asc(), expense.id.asc())
                .fetch();
    }

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
