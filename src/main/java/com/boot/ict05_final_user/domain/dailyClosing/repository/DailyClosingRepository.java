package com.boot.ict05_final_user.domain.dailyClosing.repository;

import com.boot.ict05_final_user.domain.dailyClosing.entity.DailyClosing;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

/**
 * 일일 시재 마감 헤더를 다루는 레포지토리.
 * 기본 JPA 기능 + 주문 집계용 커스텀 메서드를 함께 제공한다.
 */
public interface DailyClosingRepository
        extends JpaRepository<DailyClosing, Long>, DailyClosingRepositoryCustom {

    Optional<DailyClosing> findByStoreIdAndClosingDate(Long storeId, LocalDate closingDate);
}
