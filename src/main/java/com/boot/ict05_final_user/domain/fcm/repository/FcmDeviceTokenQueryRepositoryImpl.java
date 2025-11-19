// src/main/java/com/boot/ict05_final_user/domain/fcm/repository/FcmDeviceTokenQueryRepositoryImpl.java
package com.boot.ict05_final_user.domain.fcm.repository;

import com.boot.ict05_final_user.domain.fcm.entity.AppType;
import com.boot.ict05_final_user.domain.fcm.entity.FcmDeviceToken;
import com.boot.ict05_final_user.domain.fcm.entity.PlatformType;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

import static com.boot.ict05_final_user.domain.fcm.entity.QFcmDeviceToken.fcmDeviceToken;

@Repository
@RequiredArgsConstructor
public class FcmDeviceTokenQueryRepositoryImpl implements FcmDeviceTokenQueryRepository {

    private final JPAQueryFactory query;
    private final EntityManager em;

    @Override
    public FcmDeviceToken upsert(AppType appType, PlatformType platform,
                                 Long storeIdFk, Long memberIdFk,
                                 String deviceId, String token,
                                 LocalDateTime seenAt) {

        // 1) token 일치 우선
        FcmDeviceToken found = query
                .selectFrom(fcmDeviceToken)
                .where(fcmDeviceToken.token.eq(token))
                .setHint("org.hibernate.readOnly", true)
                .setHint("org.hibernate.flushMode", "COMMIT")
                .setHint("jakarta.persistence.query.timeout", 3000)
                .fetchFirst();

        if (found == null) {
            // 2) 같은 (app, platform, member, device) 로 기존 행 유무
            FcmDeviceToken byDevice = query
                    .selectFrom(fcmDeviceToken)
                    .where(allOf(
                            fcmDeviceToken.appType.eq(appType),
                            fcmDeviceToken.platform.eq(platform),
                            eqOrNull(fcmDeviceToken.memberIdFk, memberIdFk),
                            eqOrNull(fcmDeviceToken.deviceId, deviceId)
                    ))
                    .setHint("org.hibernate.readOnly", true)
                    .setHint("org.hibernate.flushMode", "COMMIT")
                    .setHint("jakarta.persistence.query.timeout", 3000)
                    .fetchFirst();

            if (byDevice == null) {
                // insert
                FcmDeviceToken row = FcmDeviceToken.builder()
                        .appType(appType)
                        .platform(platform)
                        .token(token)
                        .deviceId(deviceId)
                        .memberIdFk(memberIdFk)
                        .storeIdFk(storeIdFk)
                        .isActive(true)
                        .lastSeenAt(seenAt)
                        .build();
                em.persist(row);
                return row;
            } else {
                // update on same device
                byDevice.setToken(token);
                byDevice.setStoreIdFk(storeIdFk);
                byDevice.setMemberIdFk(memberIdFk);
                byDevice.setIsActive(true);
                byDevice.setLastSeenAt(seenAt);
                return byDevice;
            }
        } else {
            // token 재활성화
            found.setAppType(appType);
            found.setPlatform(platform);
            found.setStoreIdFk(storeIdFk);
            found.setMemberIdFk(memberIdFk);
            found.setDeviceId(deviceId);
            found.setIsActive(true);
            found.setLastSeenAt(seenAt);
            return found;
        }
    }

    @Override
    public Optional<FcmDeviceToken> findActiveByToken(String token) {
        FcmDeviceToken row = query.selectFrom(fcmDeviceToken)
                .where(fcmDeviceToken.token.eq(token), fcmDeviceToken.isActive.isTrue())
                .setHint("org.hibernate.readOnly", true)
                .setHint("org.hibernate.flushMode", "COMMIT")
                .setHint("jakarta.persistence.query.timeout", 3000)
                .fetchFirst();
        return Optional.ofNullable(row);
    }

    @Override
    public int deactivateAllByUpdatedAtBefore(LocalDateTime cutoff) {
        long affected = new JPAUpdateClause(em, fcmDeviceToken)
                .where(fcmDeviceToken.isActive.isTrue()
                        .and(fcmDeviceToken.updatedAt.before(cutoff)))
                .set(fcmDeviceToken.isActive, false)
                .execute();
        return (int) affected;
    }

    @Override
    public int deactivateAllByLastSeenAtBefore(LocalDateTime cutoff) {
        long affected = new JPAUpdateClause(em, fcmDeviceToken)
                .where(fcmDeviceToken.isActive.isTrue()
                        .and(fcmDeviceToken.lastSeenAt.isNotNull())
                        .and(fcmDeviceToken.lastSeenAt.before(cutoff)))
                .set(fcmDeviceToken.isActive, false)
                .execute();
        return (int) affected;
    }

    // helpers
    private static BooleanExpression allOf(BooleanExpression... exps) {
        BooleanExpression acc = null;
        for (BooleanExpression e : exps) {
            if (e == null) continue;
            acc = (acc == null) ? e : acc.and(e);
        }
        return acc;
    }
    private static <T> BooleanExpression eqOrNull(com.querydsl.core.types.dsl.SimpleExpression<T> col, T v) {
        return (v == null) ? null : col.eq(v);
    }
}
