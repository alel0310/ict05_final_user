// src/main/java/com/boot/ict05_final_user/domain/fcm/entity/FcmDeviceToken.java
package com.boot.ict05_final_user.domain.fcm.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * FCM 디바이스 토큰 저장.
 * (공유 DB 스키마에서도 HQ/STORE를 appType으로 구분)
 */
@Entity
@Table(name = "fcm_device_token",
        indexes = {
                @Index(name="ix_fdt_app_platform_member_dev", columnList = "appType,platform,memberId,deviceId"),
                @Index(name="ix_fdt_token", columnList = "token", unique = true),
                @Index(name="ix_fdt_store", columnList = "storeId")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor @Builder
public class FcmDeviceToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "fcm_device_token_id")
    private Long id;

    @Enumerated(EnumType.STRING)
    private AppType appType;          // HQ or STORE

    @Enumerated(EnumType.STRING)
    private PlatformType platform;    // WEB / ANDROID / IOS

    private Long storeId;             // 소속 점포
    private Long memberId;            // 소속 회원(점주/직원)

    @Column(nullable = false, length = 819)
    private String token;             // FCM Registration Token

    @Column(length = 128)
    private String deviceId;          // 클라이언트가 생성/전달

    private boolean revoked;          // 해지 여부
    private LocalDateTime lastSeenAt; // 마지막 활성 시각

    @CreationTimestamp
    private LocalDateTime createdAt;
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
