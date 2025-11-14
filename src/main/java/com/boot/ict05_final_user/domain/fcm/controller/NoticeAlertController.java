package com.boot.ict05_final_user.domain.fcm.controller;

import com.boot.ict05_final_user.domain.fcm.service.NoticeAlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/fcm/notice")
@RequiredArgsConstructor
@Slf4j
public class NoticeAlertController {

    private final NoticeAlertService noticeAlertService;

    /**
     * [HQ → USER 내부 콜]
     * 공지 등록 시 가맹점 대상 FCM 발송.
     * - 인증/인가 요구 없음 (서버 간 내부 호출)
     */
    @PostMapping("/created/{noticeId}")
    public Map<String, Object> created(@PathVariable Long noticeId) {
        int sent = noticeAlertService.sendNoticeCreatedBroadcast(noticeId);
        return Map.of(
                "status", "ok",
                "mode", "created",
                "noticeId", noticeId,
                "sent", sent
        );
    }

    /**
     * [HQ → USER 내부 콜]
     * 공지 수정 시 가맹점 대상 FCM 발송.
     */
    @PostMapping("/updated/{noticeId}")
    public Map<String, Object> updated(@PathVariable Long noticeId) {
        int sent = noticeAlertService.sendNoticeUpdatedBroadcast(noticeId);
        return Map.of(
                "status", "ok",
                "mode", "updated",
                "noticeId", noticeId,
                "sent", sent
        );
    }
}
