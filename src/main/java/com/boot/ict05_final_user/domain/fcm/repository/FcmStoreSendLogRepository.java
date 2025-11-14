package com.boot.ict05_final_user.domain.fcm.repository;

import com.boot.ict05_final_user.domain.fcm.entity.FcmStoreSendLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;

public interface FcmStoreSendLogRepository extends JpaRepository<FcmStoreSendLog, Long> {

    /** 공지 dedupe 예시: 카테고리/레퍼런스 기준으로 이미 발송 여부 확인 */
    boolean existsByCategoryAndRefTypeAndRefId(String category, String refType, Long refId);

    /** 재고/유통 알림: (카테고리 + store + ref_date) 기준으로 하루 1번 dedupe 할 때 사용 가능 */
    boolean existsByCategoryAndStoreIdFkAndRefDate(String category, Long storeIdFk, LocalDate refDate);
}
