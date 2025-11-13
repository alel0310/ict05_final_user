package com.boot.ict05_final_user.domain.fcm.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "fcm_device_token",
        indexes = {
                @Index(name="ix_device_member", columnList = "member_id_fk"),
                @Index(name="ix_device_store",  columnList = "store_id_fk"),
                @Index(name="ix_device_staff",  columnList = "staff_id_fk")
        },
        uniqueConstraints = @UniqueConstraint(name="uq_fcm_token", columnNames = "token"))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FcmDeviceToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long fcmDeviceTokenId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private AppType appType; // HQ / STORE

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private PlatformType platform; // ANDROID / IOS / WEB

    @Column(nullable = false, length = 512)
    private String token;

    @Column(length = 128)
    private String deviceId;

    @Column(name = "member_id_fk")
    private Long memberIdFk;

    @Column(name = "store_id_fk")
    private Long storeIdFk;

    @Column(name = "staff_id_fk")
    private Long staffIdFk;

    @Column(nullable = false)
    private Boolean isActive = true;

    private LocalDateTime lastSeenAt;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    void onUpdate() { this.updatedAt = LocalDateTime.now(); }

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (isActive == null) isActive = true;
    }
}
