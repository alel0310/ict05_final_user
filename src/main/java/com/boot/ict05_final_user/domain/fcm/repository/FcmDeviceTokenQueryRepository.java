// src/main/java/com/boot/ict05_final_user/domain/fcm/repository/FcmDeviceTokenQueryRepository.java
package com.boot.ict05_final_user.domain.fcm.repository;

import com.boot.ict05_final_user.domain.fcm.entity.AppType;
import com.boot.ict05_final_user.domain.fcm.entity.FcmDeviceToken;
import com.boot.ict05_final_user.domain.fcm.entity.PlatformType;

import java.time.LocalDateTime;
import java.util.Optional;

public interface FcmDeviceTokenQueryRepository {
    /**
     * (appType, platform, memberId, deviceId) 조합 또는 token 기준으로 업서트.
     */
    FcmDeviceToken upsert(AppType appType, PlatformType platform,
                          Long storeId, Long memberId,
                          String deviceId, String token,
                          LocalDateTime seenAt);

    Optional<FcmDeviceToken> findActiveByToken(String token);
}
