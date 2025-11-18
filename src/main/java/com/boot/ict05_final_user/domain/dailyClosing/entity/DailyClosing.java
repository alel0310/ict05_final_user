package com.boot.ict05_final_user.domain.dailyClosing.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 가맹점 일일 시재 및 마감 정보를 저장하는 엔티티.
 * 점포별, 날짜별로 하루에 한 건씩 저장한다.
 */
@Entity
@Table(
        name = "store_daily_closing",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_store_daily_closing_store_date",
                        columnNames = {"store_id", "closing_date"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyClosing {

    /** PK */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 가맹점 ID */
    @Column(name = "store_id", nullable = false)
    private Long storeId;

    /** 마감 기준 일자 */
    @Column(name = "closing_date", nullable = false)
    private LocalDate closingDate;

    // -------------결제 수단 / 주문유형별 매출-------------

    /** 현금 방문 매출 합계 */
    @Column(name = "cash_visit_sales", nullable = false)
    private Long cashVisitSales;

    /** 현금 포장 매출 합계 */
    @Column(name = "cash_takeout_sales", nullable = false)
    private Long cashTakeoutSales;

    /** 현금 배달 매출 합계 */
    @Column(name = "cash_delivery_sales", nullable = false)
    private Long cashDeliverySales;

    /** 카드 방문 매출 합계 */
    @Column(name = "card_visit_sales", nullable = false)
    private Long cardVisitSales;

    /** 카드 포장 매출 합계 */
    @Column(name = "card_takeout_sales", nullable = false)
    private Long cardTakeoutSales;

    /** 카드 배달 매출 합계 */
    @Column(name = "card_delivery_sales", nullable = false)
    private Long cardDeliverySales;

    /** 상품권 매출 합계 */
    @Column(name = "voucher_sales", nullable = false)
    private Long voucherSales;

    // -------------할인 / 환불-------------

    /** 총 할인 금액 */
    @Column(name = "total_discount", nullable = false)
    private Long totalDiscount;

    /** 총 환불 금액 */
    @Column(name = "total_refund", nullable = false)
    private Long totalRefund;

    // -------------시재 관련 금액-------------

    /** 시작 시재(준비금) */
    @Column(name = "starting_cash", nullable = false)
    private Long startingCash;

    /** 현금 지출 합계 */
    @Column(name = "total_expense", nullable = false)
    private Long totalExpense;

    /** 은행 입금액 */
    @Column(name = "deposit_amount", nullable = false)
    private Long depositAmount;

    /** 이론상 시재금 (시작금 + 현금매출 - 지출 - 입금) */
    @Column(name = "calculated_cash", nullable = false)
    private Long calculatedCash;

    /** 실제 시재금 (권종별 합계) */
    @Column(name = "actual_cash", nullable = false)
    private Long actualCash;

    /** 입금 후 이월 시재금(이론값) */
    @Column(name = "carryover_cash", nullable = false)
    private Long carryoverCash;

    /** 차액 (actual - calculated) */
    @Column(name = "difference_amount", nullable = false)
    private Long differenceAmount;

    /** 차액 사유 메모 */
    @Column(name = "difference_memo", length = 1000)
    private String differenceMemo;

    /** 마감 여부 (true 이면 해당 일자는 이미 마감 완료) */
    @Column(name = "is_closed", nullable = false)
    private boolean isClosed;

    /** 지출 항목 컬렉션 */
    @OneToMany(mappedBy = "closing", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DailyClosingExpense> expenses = new ArrayList<>();

    /** 권종별 시재 컬렉션 */
    @OneToMany(mappedBy = "closing", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DailyClosingDenom> denoms = new ArrayList<>();

    /** 마감 처리한 직원(점주/알바 등) ID */
    @Column(name = "created_by_member_id")
    private Long createdByMemberId;

    /** 생성 일시 */
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /** 수정 일시 */
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * 마감 여부를 boolean 타입으로 반환하는 헬퍼 메서드.
     *
     * @return true 이면 마감 완료, false 이면 미마감 상태
     */
    public boolean isClosed() {
        return Boolean.TRUE.equals(isClosed);
    }

    /**
     * 마감 여부를 설정한다.
     *
     * @param isClosed true 이면 마감 완료, false 이면 미마감 상태
     */
    public void setClosed(boolean isClosed) {
        this.isClosed = isClosed;
    }

    // 지출 컬렉션 조작 편의 메서드
    public void clearExpenses() {
        this.expenses.clear();
    }

    public void addExpense(DailyClosingExpense expense) {
        if (expense == null) return;
        expense.setClosing(this);
        this.expenses.add(expense);
    }

    // 권종 컬렉션 조작 편의 메서드
    public void clearDenoms() {
        this.denoms.clear();
    }

    public void addDenom(DailyClosingDenom denom) {
        if (denom == null) return;
        denom.setClosing(this);
        this.denoms.add(denom);
    }

}
