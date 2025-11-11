// src/main/java/com/boot/ict05_final_user/domain/fcm/service/FcmService.java
package com.boot.ict05_final_user.domain.fcm.service;

import com.boot.ict05_final_user.domain.fcm.config.FcmProperties;
import com.boot.ict05_final_user.domain.fcm.dto.FcmDtos.SendTestReq;
import com.boot.ict05_final_user.domain.fcm.dto.FcmDtos.TokenUpsertReq;
import com.boot.ict05_final_user.domain.fcm.entity.AppType;
import com.boot.ict05_final_user.domain.fcm.entity.FcmDeviceToken;
import com.boot.ict05_final_user.domain.fcm.entity.PlatformType;
import com.boot.ict05_final_user.domain.fcm.repository.FcmDeviceTokenRepository;
import com.google.firebase.messaging.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * FCM 토큰/토픽 관리 + 메시지 발송 서비스.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FcmService {

    private final FirebaseMessaging messaging;
    private final FcmDeviceTokenRepository tokenRepo;
    private final FcmProperties props;

    /** 토큰 업서트 (STORE 전용) */
    @Transactional
    public FcmDeviceToken upsertStoreToken(Long storeId, Long memberId, TokenUpsertReq req) {
        PlatformType platform = req.platform() == null ? PlatformType.WEB : req.platform();
        return tokenRepo.upsert(AppType.STORE, platform, storeId, memberId,
                req.deviceId(), req.token(), LocalDateTime.now());
    }

    /** 토픽 구독/해제 */
    @Transactional
    public void subscribe(String token, String topic) throws FirebaseMessagingException {
        TopicManagementResponse res = messaging.subscribeToTopic(java.util.List.of(token), topic);
        log.info("[FCM] subscribe {} -> {} (success={}, fail={})", token, topic, res.getSuccessCount(), res.getFailureCount());
    }
    @Transactional
    public void unsubscribe(String token, String topic) throws FirebaseMessagingException {
        TopicManagementResponse res = messaging.unsubscribeFromTopic(java.util.List.of(token), topic);
        log.info("[FCM] unsubscribe {} -> {} (success={}, fail={})", token, topic, res.getSuccessCount(), res.getFailureCount());
    }

    /** 공용 발사(토큰 or 토픽) – 웹/안드로이드 동시 지원 Payload */
    @Transactional(readOnly = true)
    public String sendCommon(String tokenOrTopic, boolean isTopic,
                             String title, String body, String link, Map<String, String> dataExtra)
            throws FirebaseMessagingException {

        WebpushNotification webpushNoti = WebpushNotification.builder()
                .setTitle(title).setBody(body).setIcon(props.getWebpush().getDefaultIcon())
                .build();

        WebpushConfig.Builder webpush = WebpushConfig.builder()
                .setNotification(webpushNoti)
                .setFcmOptions(WebpushFcmOptions.withLink(link))
                .putData("link", link);

        AndroidNotification androidNoti = AndroidNotification.builder()
                .setChannelId("default")
                .setTitle(title).setBody(body)
                .build();

        AndroidConfig.Builder android = AndroidConfig.builder()
                .setPriority(AndroidConfig.Priority.HIGH)
                .setNotification(androidNoti)
                .putData("link", link);

        // 추가 데이터 병합
        if (dataExtra != null) {
            dataExtra.forEach((k, v) -> {
                webpush.putData(k, v);
                android.putData(k, v);
            });
        }

        Message.Builder mb = Message.builder()
                .setWebpushConfig(webpush.build())
                .setAndroidConfig(android.build());

        if (isTopic) mb.setTopic(tokenOrTopic); else mb.setToken(tokenOrTopic);

        return messaging.send(mb.build());
    }

    /** 테스트 요청 DTO 기반 */
    @Transactional(readOnly = true)
    public String sendTest(SendTestReq req) throws FirebaseMessagingException {
        return sendCommon(req.tokenOrTopic(), req.topic(), req.title(), req.body(), req.link(), Map.of("type", "TEST"));
    }

    /** HQ 공지 브릿지(선택): store-all 또는 store-{id}에 발사 */
    @Transactional(readOnly = true)
    public String sendHqNoticeToStores(String topic, String title, String body, String link) throws FirebaseMessagingException {
        return sendCommon(topic, true, title, body, link, Map.of("type", "HQ_NOTICE"));
    }

    /** 재고부족 알림 */
    @Transactional(readOnly = true)
    public String sendInventoryLow(long storeId, String title, String body, String link) throws FirebaseMessagingException {
        return sendCommon("inv-low-" + storeId, true, title, body, link, Map.of("type", "INV_LOW", "storeId", String.valueOf(storeId)));
    }

    /** 유통임박 알림 */
    @Transactional(readOnly = true)
    public String sendExpireSoon(long storeId, String title, String body, String link) throws FirebaseMessagingException {
        return sendCommon("expire-soon-" + storeId, true, title, body, link, Map.of("type", "EXP_SOON", "storeId", String.valueOf(storeId)));
    }
}
