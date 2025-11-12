package com.boot.ict05_final_user.domain.fcm.controller;

import com.boot.ict05_final_user.config.security.jwt.service.JwtService;
import com.boot.ict05_final_user.domain.fcm.dto.FcmDtos;
import com.boot.ict05_final_user.domain.fcm.entity.AppType;
import com.boot.ict05_final_user.domain.fcm.service.FcmService;
import com.google.firebase.messaging.FirebaseMessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/fcm")
@RequiredArgsConstructor
@Slf4j
public class FcmController {

    private final FcmService fcmService;
    private final JwtService jwtService;

    /** JWT/Principal에서 storeId, memberId 추출 (둘 다 없으면 null 유지) */
    private static class Ids { Long storeId; Long memberId; }

    private Ids resolveIds(Object principal, String authHeader) {
        Ids ids = new Ids();

        // 1) 앱에서 사용하는 커스텀 Principal 타입이면 거기서 우선 추출
        try {
            if (principal != null) {
                // 리플렉션으로 getStoreId/getMemberId 있으면 호출
                var cls = principal.getClass();
                var mStore = cls.getMethod("getStoreId");
                var mMember = cls.getMethod("getMemberId");
                Object sid = mStore.invoke(principal);
                Object mid = mMember.invoke(principal);
                if (sid instanceof Number) ids.storeId = ((Number) sid).longValue();
                if (mid instanceof Number) ids.memberId = ((Number) mid).longValue();
            }
        } catch (Exception ignore) { /* principal 타입 다르면 건너뜀 */ }

//        // 2) Authorization: Bearer ... 에서 JWT 클레임으로 보강
//        if (authHeader != null && authHeader.startsWith("Bearer ")) {
//            try {
//                var claims = jwtService.parseClaims(authHeader.substring(7));
//                Number sid = claims.get("sid", Number.class);  // storeId
//                Number mid = claims.get("mid", Number.class);  // memberId
//                if (ids.storeId == null && sid != null) ids.storeId = sid.longValue();
//                if (ids.memberId == null && mid != null) ids.memberId = mid.longValue();
//            } catch (Exception e) {
//                log.warn("[FCM] JWT parse failed: {}", e.getMessage());
//            }
//        }
        return ids;
    }

    /** 토큰 업서트 */
    @PostMapping("/token")
    @PreAuthorize("hasAnyRole('STORE','OWNER','STAFF','USER')") // 실제 발급 Role에 맞게 조정
    public Map<String, Object> upsertToken(
            @AuthenticationPrincipal Object me,
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody FcmDtos.TokenUpsertReq req
    ) {
        log.info("[FCM] upsert req token={}, platform={}, deviceId={}", req.token(), req.platform(), req.deviceId());

        Ids ids = resolveIds(me, auth);
        if (ids.storeId == null || ids.memberId == null) {
            // 최소한 memberId는 있어야 사용자-디바이스를 매핑할 수 있음
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "NO_AUTH");
        }

        var row = fcmService.upsertStoreToken(ids.storeId, ids.memberId, req);
        return Map.of("status", "ok", "id", row.getId(), "appType", AppType.STORE);
    }

    /** 토픽 구독 */
    @PostMapping("/topic/subscribe")
    @PreAuthorize("hasAnyRole('STORE','OWNER','STAFF','USER')")
    public Map<String, Object> subscribe(@RequestParam String token, @RequestParam String topic)
            throws FirebaseMessagingException {
        fcmService.subscribe(token, topic);
        return Map.of("status", "ok");
    }

    /** 토픽 해제 */
    @PostMapping("/topic/unsubscribe")
    @PreAuthorize("hasAnyRole('STORE','OWNER','STAFF','USER')")
    public Map<String, Object> unsubscribe(@RequestParam String token, @RequestParam String topic)
            throws FirebaseMessagingException {
        fcmService.unsubscribe(token, topic);
        return Map.of("status", "ok");
    }

    /** 테스트 발사 */
    @PostMapping("/send/test")
    @PreAuthorize("hasAnyRole('STORE','OWNER','STAFF','USER')")
    public Map<String, Object> sendTest(@RequestBody FcmDtos.SendTestReq req)
            throws FirebaseMessagingException {
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
        String id = fcmService.sendHqNoticeToStores(topic, title, body, link);
        return Map.of("status", "ok", "messageId", id);
    }
}
