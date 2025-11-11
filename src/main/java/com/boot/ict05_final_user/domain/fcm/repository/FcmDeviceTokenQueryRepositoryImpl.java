package com.boot.ict05_final_user.domain.fcm.repository;

import com.boot.ict05_final_user.domain.fcm.entity.AppType;
import com.boot.ict05_final_user.domain.fcm.entity.FcmDeviceToken;
import com.boot.ict05_final_user.domain.fcm.entity.PlatformType;
import com.boot.ict05_final_user.domain.fcm.repository.FcmDeviceTokenQueryRepository;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

import static com.boot.ict05_final_user.domain.fcm.entity.QFcmDeviceToken.fcmDeviceToken;

/**
 * QueryDSL 기반 토큰 업서트/조회.
 */
@Repository
@RequiredArgsConstructor
public class FcmDeviceTokenQueryRepositoryImpl implements FcmDeviceTokenQueryRepository {

    private final JPAQueryFactory query;
    private final EntityManager em;

    @Override
    public FcmDeviceToken upsert(AppType appType, PlatformType platform,
                                 Long storeId, Long memberId,
                                 String deviceId, String token,
                                 LocalDateTime seenAt) {

        // 1) 우선 token 일치로 조회
        FcmDeviceToken found = query
                .selectFrom(fcmDeviceToken)
                .where(fcmDeviceToken.token.eq(token))
                .setHint("org.hibernate.readOnly", true)
                .setHint("org.hibernate.flushMode", "COMMIT")
                .setHint("javax.persistence.query.timeout", 3000)
                .fetchFirst();

        if (found == null) {
            // 2) token이 처음이면 (appType, platform, memberId, deviceId)로도 한 번 더 조회 (동일 기기 교체 케이스)
            FcmDeviceToken byDevice = query
                    .selectFrom(fcmDeviceToken)
                    .where(allOf(
                            fcmDeviceToken.appType.eq(appType),
                            fcmDeviceToken.platform.eq(platform),
                            eqOrNull(fcmDeviceToken.memberId, memberId),
                            eqOrNull(fcmDeviceToken.deviceId, deviceId)
                    ))
                    .setHint("org.hibernate.readOnly", true)
                    .setHint("org.hibernate.flushMode", "COMMIT")
                    .setHint("javax.persistence.query.timeout", 3000)
                    .fetchFirst();

            if (byDevice == null) {
                // insert
                FcmDeviceToken row = FcmDeviceToken.builder()
                        .appType(appType).platform(platform)
                        .storeId(storeId).memberId(memberId)
                        .deviceId(deviceId).token(token)
                        .revoked(false).lastSeenAt(seenAt)
                        .build();
                em.persist(row);
                return row;
            } else {
                // update on same device
                byDevice.setToken(token);
                byDevice.setStoreId(storeId);
                byDevice.setMemberId(memberId);
                byDevice.setRevoked(false);
                byDevice.setLastSeenAt(seenAt);
                return byDevice;
            }
        } else {
            // token 재활성화
            found.setAppType(appType);
            found.setPlatform(platform);
            found.setStoreId(storeId);
            found.setMemberId(memberId);
            found.setDeviceId(deviceId);
            found.setRevoked(false);
            found.setLastSeenAt(seenAt);
            return found;
        }
    }

    @Override
    public Optional<FcmDeviceToken> findActiveByToken(String token) {
        FcmDeviceToken row = query.selectFrom(fcmDeviceToken)
                .where(fcmDeviceToken.token.eq(token), fcmDeviceToken.revoked.isFalse())
                .setHint("org.hibernate.readOnly", true)
                .setHint("org.hibernate.flushMode", "COMMIT")
                .setHint("javax.persistence.query.timeout", 3000)
                .fetchFirst();
        return Optional.ofNullable(row);
    }

    // ===== BooleanExpression helpers =====
    private static BooleanExpression allOf(BooleanExpression... exps) {
        BooleanExpression acc = null;
        for (BooleanExpression e : exps) {
            if (e == null) continue;
            acc = (acc == null) ? e : acc.and(e);
        }
        return acc;
    }
    private static <T> BooleanExpression eqOrNull(com.querydsl.core.types.dsl.SimpleExpression<T> col, T v) {
        return (v == null) ? null : ((com.querydsl.core.types.dsl.SimpleExpression<T>) col).eq(v);
    }
}