package com.boot.ict05_final_user.domain.fcm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 가맹점용 FCM 발송 로그.
 * - 본사 fcm_send_log 와 별도 테이블 (fcm_store_send_log)
 * - 공지 / 재고부족 / 유통임박 / 테스트 공용으로 사용.
 */
@Entity
@Table(
        name = "fcm_store_send_log",
        indexes = {
                @Index(name = "ix_store_log_store", columnList = "store_id_fk"),
                @Index(name = "ix_store_log_member", columnList = "member_id_fk"),
                @Index(name = "ix_store_log_category", columnList = "category"),
                @Index(name = "ix_store_log_ref", columnList = "ref_type,ref_id"),
                @Index(name = "ix_store_log_ref_date", columnList = "ref_date")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FcmStoreSendLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long fcmStoreSendLogId;

    /** HQ/STORE 구분 (여기서는 주로 STORE) */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private AppType appType;

    /** NOTICE / STOCK_LOW / EXPIRE_SOON / TEST / 기타 */
    @Column(nullable = false, length = 32)
    private String category;

    /** 알림 기준이 되는 스토어/멤버 */
    @Column(name = "store_id_fk")
    private Long storeIdFk;

    @Column(name = "member_id_fk")
    private Long memberIdFk;

    /** 토픽 또는 토큰 */
    @Column(length = 255)
    private String topic; // isTopic=true 일 때 채움

    @Column(length = 512)
    private String token; // isTopic=false 일 때 채움

    /** 표시되는 타이틀/본문 */
    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 1000)
    private String body;

    /** data.link / WebpushFcmOptions link */
    @Column(length = 1024)
    private String link;

    /** 비즈니스 기준 (예: NOTICE / INVENTORY 등) */
    @Column(name = "ref_type", length = 32)
    private String refType;

    /** ref_type 에 따라 notice_id / 기타 PK */
    @Column(name = "ref_id")
    private Long refId;

    /** 재고/유통 스캔 기준일 등 */
    @Column(name = "ref_date")
    private LocalDate refDate;

    /** Firebase 가 리턴하는 messageId */
    @Column(name = "result_message_id", length = 255)
    private String resultMessageId;

    /** 에러 메시지(있다면) */
    @Column(name = "result_error", length = 512)
    private String resultError;

    /** 실제 발송 시각 */
    @Column(nullable = false)
    private LocalDateTime sentAt;

    /** 로우 생성시각 */
    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (sentAt == null) {
            sentAt = now;
        }
        if (createdAt == null) {
            createdAt = now;
        }
        if (appType == null) {
            appType = AppType.STORE;
        }
        if (category == null) {
            category = "GENERAL";
        }
    }
}
