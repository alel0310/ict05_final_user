// src/main/java/com/boot/ict05_final_user/domain/fcm/service/FcmService.java
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
import com.google.firebase.ErrorCode;
import com.google.firebase.messaging.*;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * FCM 토큰/토픽 관리 + 메시지 발송 서비스.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "fcm.enabled", havingValue = "true")
public class FcmService {

    private final FirebaseMessaging messaging;
    private final FcmDeviceTokenRepository tokenRepo;
    private final FcmProperties props;
    private final FcmStoreSendLogRepository storeLogRepo;

    // ========= 로그 메타 =========
    @Getter
    @Builder
    public static class StoreLogMeta {
        @Builder.Default private AppType appType = AppType.STORE;  // 기본: STORE
        @Builder.Default private String category = "GENERAL";       // NOTICE / STOCK_LOW / EXPIRE_SOON / TEST / GENERAL
        private Long storeId;
        private Long memberId;
        private String refType;   // 비즈니스 기준 (NOTICE / INVENTORY 등)
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
                storeId,    // store_id_fk
                memberId,   // member_id_fk
                req.deviceId(),
                req.token(),
                LocalDateTime.now()
        );
    }

    /** 단일 토큰 구독/해제 */
    public void subscribe(String token, String topic) throws FirebaseMessagingException {
        TopicManagementResponse res = messaging.subscribeToTopic(List.of(token), topic);
        log.info("[FCM] subscribe {} -> {} (success={}, fail={})", token, topic, res.getSuccessCount(), res.getFailureCount());
    }

    public void unsubscribe(String token, String topic) throws FirebaseMessagingException {
        TopicManagementResponse res = messaging.unsubscribeFromTopic(List.of(token), topic);
        log.info("[FCM] unsubscribe {} -> {} (success={}, fail={})", token, topic, res.getSuccessCount(), res.getFailureCount());
    }

    /** 다중 토큰 벌크 구독/해제 (2-2 동기화용) */
    public void subscribeAll(List<String> tokens, String topic) throws FirebaseMessagingException {
        if (tokens == null || tokens.isEmpty()) return;
        TopicManagementResponse res = messaging.subscribeToTopic(tokens, topic);
        log.info("[FCM] subscribeAll {} -> {} (success={}, fail={})", tokens.size(), topic, res.getSuccessCount(), res.getFailureCount());
    }

    public void unsubscribeAll(List<String> tokens, String topic) throws FirebaseMessagingException {
        if (tokens == null || tokens.isEmpty()) return;
        TopicManagementResponse res = messaging.unsubscribeFromTopic(tokens, topic);
        log.info("[FCM] unsubscribeAll {} -> {} (success={}, fail={})", tokens.size(), topic, res.getSuccessCount(), res.getFailureCount());
    }

    // ========= 공통 발사 + 로그 기록 =========

    /**
     * 실제 발송 + 로그 기록을 담당하는 내부 공통 메서드.
     */
    protected String sendCommonWithLog(String tokenOrTopic, boolean isTopic,
                                       String title, String body, String link,
                                       Map<String, String> dataExtra,
                                       StoreLogMeta meta) throws FirebaseMessagingException {

        // 기본 링크 & 아이콘 null-safe
        String safeLink = (link == null || link.isBlank()) ? "/" : link;
        String icon = null;
        try {
            icon = (props.getWebpush() != null) ? props.getWebpush().getDefaultIcon() : null;
        } catch (Exception ignore) { /* no-op */ }

        WebpushNotification.Builder webpushNoti = WebpushNotification.builder()
                .setTitle(title)
                .setBody(body);
        if (icon != null && !icon.isBlank()) {
            webpushNoti.setIcon(icon);
        }

        WebpushConfig.Builder webpush = WebpushConfig.builder()
                .setNotification(webpushNoti.build())
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

        if (isTopic) mb.setTopic(tokenOrTopic);
        else mb.setToken(tokenOrTopic);

        LocalDateTime now = LocalDateTime.now();
        String messageId = null;
        String errorMsg = null;

        try {
            messageId = messaging.send(mb.build());
            log.info("[FCM] send ok id={} target={} isTopic={}", messageId, tokenOrTopic, isTopic);
            return messageId;

        } catch (FirebaseMessagingException e) {
            errorMsg = e.getErrorCode() + ":" + e.getMessage();
            log.warn("[FCM] send fail target={} isTopic={} code={} msg={}",
                    tokenOrTopic, isTopic, e.getErrorCode(), e.getMessage());

            // 토큰 대상의 경우, 만료/미등록 토큰 비활성화
            if (!isTopic) {
                handleTokenError(tokenOrTopic, e);
            }
            throw e;

        } finally {
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

    /** 토큰 발송(직접) – 필요 시 사용 */
    public String sendToToken(AppType app, String token,
                              String title, String body, String link, Map<String,String> data)
            throws FirebaseMessagingException {
        StoreLogMeta meta = StoreLogMeta.builder()
                .appType(app)
                .category("DIRECT")
                .build();
        return sendCommonWithLog(token, false, title, body, link, data, meta);
    }

    private void handleTokenError(String token, FirebaseMessagingException e) {
        // 1) 우선 FCM 전용 코드가 있으면 그걸 사용
        MessagingErrorCode mcode = e.getMessagingErrorCode();
        if (mcode != null) {
            if (mcode == MessagingErrorCode.UNREGISTERED
                    || mcode == MessagingErrorCode.INVALID_ARGUMENT) {
                deactivateToken(token, "messaging:" + mcode.name());
                return;
            }
            log.debug("[FCM] non-deactivation messaging error: {} token={} msg={}",
                    mcode, token, e.getMessage());
            return;
        }

        // 2) 구버전/환경에 따라 공통 ErrorCode만 제공되는 경우
        ErrorCode gcode = e.getErrorCode(); // com.google.firebase.ErrorCode
        if (gcode != null) {
            // UNREGISTERED는 공통 ErrorCode에서 보통 NOT_FOUND로 맵핑되는 케이스가 있습니다.
            if (gcode == ErrorCode.INVALID_ARGUMENT || gcode == ErrorCode.NOT_FOUND) {
                deactivateToken(token, "generic:" + gcode.name());
                return;
            }
        }

        // 3) 마지막 안전장치: 메시지 문자열 매칭(운영 로그 기준)
        String msg = e.getMessage();
        if (msg != null && (
                msg.contains("registration-token-not-registered")
                        || msg.contains("invalid-registration-token")
                        || msg.contains("requested entity was not found")
        )) {
            deactivateToken(token, "message-match");
            return;
        }

        log.debug("[FCM] non-deactivation error token={} errCode={} msg={}",
                token, (gcode != null ? gcode.name() : null), e.getMessage());
    }

    private void deactivateToken(String token, String reason) {
        tokenRepo.findByToken(token).ifPresent(row -> row.setIsActive(false));
        log.info("[FCM] token deactivated (reason={}) token={}", reason, token);
    }

    // ========= 고수준 API들 (테스트/공지/재고/유통) =========

    /** 테스트 요청 DTO 기반 (link는 data.link로 전달) */
    public String sendTest(FcmTestSendRequest req) throws FirebaseMessagingException {
        String link = "/";
        Map<String, String> extra = new HashMap<>();
        extra.put("type", "TEST");

        if (req.data() != null) {
            String maybeLink = req.data().get("link");
            if (maybeLink != null && !maybeLink.isBlank()) link = maybeLink;
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

    /** 유통임박 알림 */
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
