package com.boot.ict05_final_user.domain.dailyClosing.dto;

import com.boot.ict05_final_user.domain.dailyClosing.entity.DailyClosing;
import com.boot.ict05_final_user.domain.dailyClosing.entity.DailyClosingDenom;
import com.boot.ict05_final_user.domain.dailyClosing.entity.DailyClosingExpense;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

/**
 * 일일 마감 상세 조회 응답 DTO.
 * DailyClosing 한 건 + 권종 + 지출 목록을 한 번에 내려준다.
 *
 * 프론트의 DailyClosingDetailResponse 타입과 필드명을 맞춘다.
 */
@Getter
@Builder
public class DailyClosingDetailResponse {

    private LocalDate closingDate;

    private Long cashVisitSales;
    private Long cashTakeoutSales;
    private Long cashDeliverySales;

    private Long cardVisitSales;
    private Long cardTakeoutSales;
    private Long cardDeliverySales;

    private Long voucherSales;

    private Long totalExpense;
    private Long differenceAmount;

    private boolean closed;

    // 권종·지출은 이미 쓰고 있는 DTO 재사용
    private List<DailyClosingDenomDto> denoms;
    private List<DailyClosingExpenseDto> expenses;

    // 프론트의 memo 는 differenceMemo 와 매핑
    private String memo;

    public static DailyClosingDetailResponse from(
            DailyClosing closing,
            List<DailyClosingDenom> denomEntities,
            List<DailyClosingExpense> expenseEntities
    ) {
        return DailyClosingDetailResponse.builder()
                .closingDate(closing.getClosingDate())

                .cashVisitSales(closing.getCashVisitSales())
                .cashTakeoutSales(closing.getCashTakeoutSales())
                .cashDeliverySales(closing.getCashDeliverySales())

                .cardVisitSales(closing.getCardVisitSales())
                .cardTakeoutSales(closing.getCardTakeoutSales())
                .cardDeliverySales(closing.getCardDeliverySales())

                .voucherSales(closing.getVoucherSales())
                .totalExpense(closing.getTotalExpense())
                .differenceAmount(closing.getDifferenceAmount())
                .closed(closing.isClosed())

                .denoms(
                        denomEntities.stream()
                                .map(DailyClosingDenomDto::from)
                                .toList()
                )
                .expenses(
                        expenseEntities.stream()
                                .map(DailyClosingExpenseDto::from)
                                .toList()
                )
                .memo(closing.getDifferenceMemo())
                .build();
    }
}

