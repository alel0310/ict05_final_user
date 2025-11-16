package com.boot.ict05_final_user.domain.dailyClosing.service;

import com.boot.ict05_final_user.domain.dailyClosing.dto.DailyClosingDenomDto;
import com.boot.ict05_final_user.domain.dailyClosing.dto.DailyClosingExpenseDto;
import com.boot.ict05_final_user.domain.dailyClosing.dto.DailyClosingInitResponse;
import com.boot.ict05_final_user.domain.dailyClosing.entity.DailyClosing;
import com.boot.ict05_final_user.domain.dailyClosing.repository.DailyClosingRepository;
import com.boot.ict05_final_user.domain.dailyClosing.repository.DailyClosingRepositoryCustom;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * 일일 시재 마감 조회와 관련된 도메인 서비스.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DailyClosingService {

    /** DailyClosing 관련 조회와 커스텀 쿼리를 처리하는 리포지토리 */
    private final DailyClosingRepository dailyClosingRepository;

    /**
     * 일일 시재 마감 데이터를 조회한다.
     *
     * 1. 이미 마감된 날이면 DailyClosing 및 하위 엔티티를 조회하여 응답을 구성한다.
     * 2. 아직 마감되지 않은 날이면 주문 집계 결과만 채워서 응답을 구성한다.
     *
     * @param storeId 가맹점 아이디
     * @param date    기준 일자
     * @return 화면에서 사용할 초기 데이터
     */
    public DailyClosingInitResponse getDailyClosing(Long storeId, LocalDate date) {

        // 1. 이미 마감된 날인지 확인
        DailyClosing closing = dailyClosingRepository
                .findByStoreIdAndClosingDate(storeId, date)
                .orElse(null);

        if (closing != null) {
            DailyClosingInitResponse resp = DailyClosingInitResponse.fromClosing(closing);

            // 지출 상세
            dailyClosingRepository.findExpensesByClosing(closing)
                    .forEach(e ->
                            resp.getExpenses().add(DailyClosingExpenseDto.from(e))
                    );

            // 권종 상세
            dailyClosingRepository.findDenomsByClosing(closing)
                    .forEach(d ->
                            resp.getDenoms().add(DailyClosingDenomDto.from(d))
                    );

            return resp;
        }

        // 2. 아직 마감되지 않은 날이면 주문 집계 조회
        DailyClosingRepositoryCustom.OrderDailySummary summary =
                dailyClosingRepository.getOrderDailySummary(storeId, date);

        return DailyClosingInitResponse.builder()
                .cashVisit(summary.cashVisit)
                .cashTakeout(summary.cashTakeout)
                .cashDelivery(summary.cashDelivery)
                .cardVisit(summary.cardVisit)
                .cardTakeout(summary.cardTakeout)
                .cardDelivery(summary.cardDelivery)
                .voucherTotal(summary.voucherTotal)
                .totalDiscount(summary.totalDiscount)
                .totalRefund(summary.totalRefund)
                .closed(false)
                .build();
    }
}
