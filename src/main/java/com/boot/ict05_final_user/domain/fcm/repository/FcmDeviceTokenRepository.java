package com.boot.ict05_final_user.domain.fcm.repository;

import com.boot.ict05_final_user.domain.fcm.entity.FcmDeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FcmDeviceTokenRepository extends JpaRepository<FcmDeviceToken, Long>, FcmDeviceTokenQueryRepository {
    Optional<FcmDeviceToken> findByToken(String token);
}
