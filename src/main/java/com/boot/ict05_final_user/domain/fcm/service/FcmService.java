package com.boot.ict05_final_user.domain.fcm.service;

import com.boot.ict05_final_user.domain.fcm.config.FcmProperties;
import com.boot.ict05_final_user.domain.fcm.dto.FcmRegisterTokenRequest;
import com.boot.ict05_final_user.domain.fcm.dto.FcmTestSendRequest;
import com.boot.ict05_final_user.domain.fcm.entity.AppType;
import com.boot.ict05_final_user.domain.fcm.entity.FcmDeviceToken;
import com.boot.ict05_final_user.domain.fcm.entity.FcmStoreSendLog;
import com.boot.ict05_final_user.domain.fcm.entity.PlatformType;
import com.boot.ict05_final_user.domain.fcm.repository.FcmDeviceTokenRepository;
import com.boot.ict05_final_user.domain.fcm.repository.FcmStoreSendLogRepository;
import com.google.firebase.messaging.*;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
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
    private final FcmStoreSendLogRepository storeLogRepo;

    // ========= 로그 메타 =========

    @Getter
    @Builder
    public static class StoreLogMeta {
        /** 기본: STORE */
        @Builder.Default
        private AppType appType = AppType.STORE;

        /** NOTICE / STOCK_LOW / EXPIRE_SOON / TEST / 기타 */
        @Builder.Default
        private String category = "GENERAL";

        private Long storeId;
        private Long memberId;

        /** 비즈니스 기준 (NOTICE / INVENTORY 등) */
        private String refType;
        private Long refId;
        private LocalDate refDate;
    }

    // ========= 토큰/토픽 관리 =========

    /** 토큰 업서트 (STORE 전용) */
    @Transactional
    public FcmDeviceToken upsertStoreToken(Long storeId, Long memberId, FcmRegisterTokenRequest req) {
        PlatformType platform = (req.platform() == null) ? PlatformType.WEB : req.platform();
        return tokenRepo.upsert(
                AppType.STORE,
                platform,
                storeId,           // store_id_fk
                memberId,          // member_id_fk
                req.deviceId(),
                req.token(),
                LocalDateTime.now()
        );
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

    // ========= 공통 발사 + 로그 기록 =========

    /**
     * 실제 발송 + 로그 기록을 담당하는 내부 공통 메서드.
     */
    protected String sendCommonWithLog(String tokenOrTopic, boolean isTopic,
                                       String title, String body, String link,
                                       Map<String, String> dataExtra,
                                       StoreLogMeta meta) throws FirebaseMessagingException {

        // ✅ link null-safe 기본값
        String safeLink = (link == null || link.isBlank()) ? "/" : link;

        WebpushNotification webpushNoti = WebpushNotification.builder()
                .setTitle(title)
                .setBody(body)
                .setIcon(props.getWebpush().getDefaultIcon())
                .build();

        WebpushConfig.Builder webpush = WebpushConfig.builder()
                .setNotification(webpushNoti)
                .setFcmOptions(WebpushFcmOptions.withLink(safeLink))
                .putData("link", safeLink);

        AndroidNotification androidNoti = AndroidNotification.builder()
                .setChannelId("default")
                .setTitle(title)
                .setBody(body)
                .build();

        AndroidConfig.Builder android = AndroidConfig.builder()
                .setPriority(AndroidConfig.Priority.HIGH)
                .setNotification(androidNoti)
                .putData("link", safeLink);

        if (dataExtra != null) {
            dataExtra.forEach((k, v) -> {
                if (v != null) {
                    webpush.putData(k, v);
                    android.putData(k, v);
                }
            });
        }

        Message.Builder mb = Message.builder()
                .setWebpushConfig(webpush.build())
                .setAndroidConfig(android.build());

        if (isTopic) {
            mb.setTopic(tokenOrTopic);
        } else {
            mb.setToken(tokenOrTopic);
        }

        LocalDateTime now = LocalDateTime.now();
        String messageId = null;
        String errorMsg = null;

        try {
            messageId = messaging.send(mb.build());
            log.info("[FCM] send ok id={} target={} isTopic={}", messageId, tokenOrTopic, isTopic);
            return messageId;
        } catch (FirebaseMessagingException e) {
            errorMsg = e.getMessage();
            log.warn("[FCM] send fail target={} isTopic={} err={}", tokenOrTopic, isTopic, errorMsg);
            throw e;
        } finally {
            // 로그 메타가 세팅된 경우에만 로그 INSERT
            if (meta != null) {
                try {
                    FcmStoreSendLog logRow = FcmStoreSendLog.builder()
                            .appType(meta.getAppType())
                            .category(meta.getCategory())
                            .storeIdFk(meta.getStoreId())
                            .memberIdFk(meta.getMemberId())
                            .topic(isTopic ? tokenOrTopic : null)
                            .token(isTopic ? null : tokenOrTopic)
                            .title(title)
                            .body(body)
                            .link(safeLink)
                            .refType(meta.getRefType())
                            .refId(meta.getRefId())
                            .refDate(meta.getRefDate())
                            .resultMessageId(messageId)
                            .resultError(errorMsg)
                            .sentAt(now)
                            .build();
                    storeLogRepo.save(logRow);
                } catch (Exception ex) {
                    // 로그 실패는 서비스 전체에 영향 주면 안 됨
                    log.warn("[FCM] store log insert fail: {}", ex.getMessage());
                }
            }
        }
    }

    /**
     * 기존 시그니처 유지용: 로그 메타 없이 순수 발송만 필요할 때 사용.
     */
    public String sendCommon(String tokenOrTopic, boolean isTopic,
                             String title, String body, String link, Map<String, String> dataExtra)
            throws FirebaseMessagingException {
        return sendCommonWithLog(tokenOrTopic, isTopic, title, body, link, dataExtra, null);
    }

    // ========= 고수준 API들 (테스트/공지/재고/유통) =========

    /** 테스트 요청 DTO 기반 (link는 data.link로 전달) */
    public String sendTest(FcmTestSendRequest req) throws FirebaseMessagingException {
        String link = "/";
        Map<String, String> extra = new HashMap<>();
        extra.put("type", "TEST");

        if (req.data() != null) {
            // link 추출
            String maybeLink = req.data().get("link");
            if (maybeLink != null && !maybeLink.isBlank()) link = maybeLink;

            // 나머지 데이터는 그대로 merge (link 키는 제외)
            req.data().forEach((k, v) -> {
                if (v != null && !"link".equals(k)) extra.put(k, v);
            });
        }

        StoreLogMeta meta = StoreLogMeta.builder()
                .category("TEST")
                .build();

        return sendCommonWithLog(
                req.tokenOrTopic(),
                req.topic(),
                req.title(),
                req.body(),
                link,
                extra,
                meta
        );
    }

    /** HQ 공지 브릿지(선택): store-all 또는 store-{id}에 발사 */
    public String sendHqNoticeToStores(String topic, String title, String body, String link)
            throws FirebaseMessagingException {

        StoreLogMeta meta = StoreLogMeta.builder()
                .category("NOTICE")
                .refType("NOTICE_HQ")
                .build();

        return sendCommonWithLog(
                topic,
                true,
                title,
                body,
                link,
                Map.of("type", "HQ_NOTICE"),
                meta
        );
    }

    /** 재고부족 알림 */
    public String sendInventoryLow(long storeId, String title, String body, String link)
            throws FirebaseMessagingException {

        StoreLogMeta meta = StoreLogMeta.builder()
                .category("STOCK_LOW")
                .storeId(storeId)
                .refType("INVENTORY")
                .build();

        return sendCommonWithLog(
                "inv-low-" + storeId,
                true,
                title,
                body,
                link,
                Map.of("type", "INV_LOW", "storeId", String.valueOf(storeId)),
                meta
        );
    }

    /** 유통임박 알림 (baseDate 는 InventoryAlertService 에서 넘겨줌) */
    public String sendExpireSoon(long storeId, LocalDate baseDate,
                                 String title, String body, String link)
            throws FirebaseMessagingException {

        StoreLogMeta meta = StoreLogMeta.builder()
                .category("EXPIRE_SOON")
                .storeId(storeId)
                .refType("INVENTORY")
                .refDate(baseDate)
                .build();

        return sendCommonWithLog(
                "expire-soon-" + storeId,
                true,
                title,
                body,
                link,
                Map.of("type", "EXP_SOON", "storeId", String.valueOf(storeId)),
                meta
        );
    }
}
