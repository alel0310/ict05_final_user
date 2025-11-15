package com.boot.ict05_final_user.domain.fcm.repository;

import com.boot.ict05_final_user.domain.fcm.entity.AppType;
import com.boot.ict05_final_user.domain.fcm.entity.FcmDeviceToken;
import com.boot.ict05_final_user.domain.fcm.entity.PlatformType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FcmDeviceTokenRepository extends JpaRepository<FcmDeviceToken, Long>, FcmDeviceTokenQueryRepository {
    Optional<FcmDeviceToken> findByToken(String token);

    List<FcmDeviceToken> findByMemberIdFkAndIsActiveTrue(Long memberIdFk);

    List<FcmDeviceToken> findByAppTypeAndPlatformAndMemberIdFkAndDeviceIdAndIsActiveTrue(
            AppType appType, PlatformType platform, Long memberIdFk, String deviceId
    );

    // (옵션) 멤버의 활성 토큰 문자열만 필요할 때
    default List<String> findActiveTokensOfMember(Long memberIdFk) {
        return findByMemberIdFkAndIsActiveTrue(memberIdFk).stream()
                .map(FcmDeviceToken::getToken).toList();
    }

    List<FcmDeviceToken> findByAppTypeAndIsActiveTrue(AppType appType);
}
