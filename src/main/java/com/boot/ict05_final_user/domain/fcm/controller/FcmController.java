package com.boot.ict05_final_user.domain.fcm.controller;

import com.boot.ict05_final_user.config.security.jwt.service.JwtService;
import com.boot.ict05_final_user.domain.fcm.dto.FcmRegisterTokenRequest;
import com.boot.ict05_final_user.domain.fcm.dto.FcmTestSendRequest;
import com.boot.ict05_final_user.domain.fcm.dto.StoreTopic;
import com.boot.ict05_final_user.domain.fcm.entity.AppType;
import com.boot.ict05_final_user.domain.fcm.entity.PlatformType;
import com.boot.ict05_final_user.domain.fcm.repository.FcmDeviceTokenRepository;
import com.boot.ict05_final_user.domain.fcm.service.FcmService;
import com.google.firebase.messaging.FirebaseMessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/fcm")
@RequiredArgsConstructor
@Slf4j
public class FcmController {

    private final FcmService fcmService;
    private final JwtService jwtService;
    private final FcmDeviceTokenRepository tokenRepo;

    @Value("${fcm.test.admin-only:false}")
    private boolean testAdminOnly;

    /** JWT/Principal에서 storeId, memberId 추출 (둘 다 없으면 null 유지) */
    private static class Ids { Long storeId; Long memberId; }

    private Ids resolveIds(Object principal, String authHeader) {
        Ids ids = new Ids();
        try {
            if (principal != null) {
                var cls = principal.getClass();
                var mStore = cls.getMethod("getStoreId");
                var mMember = cls.getMethod("getMemberId");
                Object sid = mStore.invoke(principal);
                Object mid = mMember.invoke(principal);
                if (sid instanceof Number) ids.storeId = ((Number) sid).longValue();
                if (mid instanceof Number) ids.memberId = ((Number) mid).longValue();
            }
        } catch (Exception ignore) { } // ignore

        if ((ids.storeId == null || ids.memberId == null) && authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                Long sid = com.boot.ict05_final_user.config.security.jwt.JWTUtil.getStoreId(token);
                Long mid = com.boot.ict05_final_user.config.security.jwt.JWTUtil.getMemberId(token);
                if (ids.storeId == null) ids.storeId = sid;
                if (ids.memberId == null) ids.memberId = mid;
            } catch (Exception e) {
                log.warn("[FCM] JWT parse failed: {}", e.getMessage());
            }
        }
        return ids;
    }

    /** 토큰 업서트 */
    @PostMapping("/token")
    @PreAuthorize("hasAnyRole('STORE','OWNER','STAFF','USER')")
    public Map<String, Object> upsertToken(
            @AuthenticationPrincipal Object me,
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody FcmRegisterTokenRequest req
    ) {
        log.info("[FCM] upsert req token={}, platform={}, deviceId={}", req.token(), req.platform(), req.deviceId());

        Ids ids = resolveIds(me, auth);
        if (ids.storeId == null || ids.memberId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "NO_AUTH");
        }

        var row = fcmService.upsertStoreToken(ids.storeId, ids.memberId, req);
        return Map.of("status", "ok", "id", row.getFcmDeviceTokenId(), "appType", AppType.STORE);
    }

    /** 토큰 revoke (token 우선, 없으면 platform+deviceId 기준) */
    @PostMapping("/token/revoke")
    @PreAuthorize("hasAnyRole('STORE','OWNER','STAFF','USER')")
    public Map<String, Object> revokeToken(
            @AuthenticationPrincipal Object me,
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody FcmRegisterTokenRequest req
    ) {
        Ids ids = resolveIds(me, auth);
        if (ids.memberId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "NO_AUTH");

        int affected = 0;

        // 1) token 명시 시 해당 레코드 비활성화
        if (req.token() != null && !req.token().isBlank()) {
            tokenRepo.findByToken(req.token()).ifPresent(row -> {
                if (Objects.equals(row.getMemberIdFk(), ids.memberId)) {
                    row.setIsActive(false);
                }
            });
            affected = 1;
        } else {
            // 2) platform + deviceId 조합
            PlatformType platform = req.platform();
            String deviceId = req.deviceId();
            if (platform == null || deviceId == null || deviceId.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "platform/deviceId required if token absent");
            }
            var rows = tokenRepo.findByAppTypeAndPlatformAndMemberIdFkAndDeviceIdAndIsActiveTrue(
                    AppType.STORE, platform, ids.memberId, deviceId
            );
            rows.forEach(r -> r.setIsActive(false));
            affected = rows.size();
        }
        return Map.of("status", "ok", "revoked", affected);
    }

    /** 토픽 구독 (허용되지 않은 토픽은 400) */
    @PostMapping("/topic/subscribe")
    @PreAuthorize("hasAnyRole('STORE','OWNER','STAFF','USER')")
    public Map<String, Object> subscribe(@RequestParam String token, @RequestParam String topic)
            throws FirebaseMessagingException {
        if (!StoreTopic.isAllowed(topic)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TOPIC_NOT_ALLOWED");
        fcmService.subscribe(token, topic);
        return Map.of("status", "ok");
    }

    /** 토픽 해제 (허용되지 않은 토픽은 400) */
    @PostMapping("/topic/unsubscribe")
    @PreAuthorize("hasAnyRole('STORE','OWNER','STAFF','USER')")
    public Map<String, Object> unsubscribe(@RequestParam String token, @RequestParam String topic)
            throws FirebaseMessagingException {
        if (!StoreTopic.isAllowed(topic)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TOPIC_NOT_ALLOWED");
        fcmService.unsubscribe(token, topic);
        return Map.of("status", "ok");
    }

    /** 테스트 발사: 운영에서 ADMIN 전용 가드 지원 */
    @PostMapping("/send/test")
    @PreAuthorize("isAuthenticated()")
    public Map<String, Object> sendTest(@AuthenticationPrincipal Object me,
                                        Authentication authentication,
                                        @RequestBody FcmTestSendRequest req)
            throws FirebaseMessagingException {

        if (testAdminOnly) {
            boolean admin = authentication != null && authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .anyMatch(a -> a.contains("ADMIN"));
            if (!admin) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN_ONLY");
        }

        String id = fcmService.sendTest(req);
        return Map.of("status", "ok", "messageId", id);
    }

    /** (선택) HQ 공지 브릿지 */
    @PostMapping("/send/hq-notice")
    @PreAuthorize("hasRole('HQ') or hasRole('ADMIN')")
    public Map<String, Object> sendHqNotice(
            @RequestParam String topic,
            @RequestParam String title,
            @RequestParam String body,
            @RequestParam String link
    ) throws FirebaseMessagingException {
        if (!StoreTopic.isAllowed(topic)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TOPIC_NOT_ALLOWED");
        String id = fcmService.sendHqNoticeToStores(topic, title, body, link);
        return Map.of("status", "ok", "messageId", id);
    }
}
