package com.boot.ict05_final_user.domain.fcm.service;

import com.boot.ict05_final_user.domain.fcm.dto.StoreTopic;
import com.boot.ict05_final_user.domain.fcm.entity.AppType;
import com.boot.ict05_final_user.domain.fcm.entity.FcmStoreSendLog;
import com.boot.ict05_final_user.domain.fcm.repository.FcmStoreSendLogRepository;
import com.boot.ict05_final_user.domain.notice.entity.Notice;
import com.boot.ict05_final_user.domain.notice.repository.NoticeRepository;
import com.boot.ict05_final_user.domain.store.entity.Store;
import com.boot.ict05_final_user.domain.store.repository.StoreRepository;
import com.google.firebase.messaging.FirebaseMessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NoticeAlertService {

    private final NoticeRepository noticeRepository;
    private final FcmService fcmService;
    private final FcmStoreSendLogRepository storeLogRepo;
    private final StoreRepository storeRepository; // ✅ 전체 가맹점 조회용

    // =========================
    // 1) HQ → USER 브로드캐스트용
    // =========================

    /**
     * 공지 등록 브로드캐스트
     * - HQ 서버에서 /fcm/notice/created/{noticeId} 호출할 때 진입
     */
    @Transactional
    public int sendNoticeCreatedBroadcast(Long noticeId) {
        return broadcastToAllStores(noticeId, "NOTICE_CREATED", "[공지] 새 공지 등록");
    }

    /**
     * 공지 수정 브로드캐스트
     * - HQ 서버에서 /fcm/notice/updated/{noticeId} 호출할 때 진입
     */
    @Transactional
    public int sendNoticeUpdatedBroadcast(Long noticeId) {
        return broadcastToAllStores(noticeId, "NOTICE_UPDATED", "[공지] 공지 수정");
    }

    /**
     * 실제 브로드캐스트 로직 (모든 가맹점 대상으로 푸시)
     */
    @Transactional
    protected int broadcastToAllStores(Long noticeId,
                                       String category,
                                       String prefixTitle) {

        Notice notice = noticeRepository.findById(noticeId).orElse(null);
        if (notice == null) {
            log.warn("[NoticeAlert] notice not found id={}", noticeId);
            return 0;
        }

        // ✅ 일단은 운영중인 모든 매장에 쏜다고 가정 (필요하면 상태 필터 메서드로 교체)
        List<Store> stores = storeRepository.findAll();

        int totalSent = 0;
        for (Store store : stores) {
            // store 엔티티의 PK 이름에 맞춰서 수정 (예: getId() 또는 getStoreId())
            Long storeId = store.getId(); // ← 필요하면 getStoreId()로 바꿔줘
            if (storeId == null) continue;

            int sent = doSend(storeId, null, noticeId, category, prefixTitle, notice);
            totalSent += sent;
        }

        log.info("[NoticeAlert] broadcast done noticeId={} category={} totalSent={}",
                noticeId, category, totalSent);
        return totalSent;
    }

    // =========================
    // 2) 기존 per-store API (있어도 됨)
    // =========================

    @Transactional
    public int sendNoticeCreated(Long storeId, Long memberId, Long noticeId) {
        Notice notice = noticeRepository.findById(noticeId).orElse(null);
        return doSend(storeId, memberId, noticeId, "NOTICE_CREATED", "[공지] 새 공지 등록", notice);
    }

    @Transactional
    public int sendNoticeUpdated(Long storeId, Long memberId, Long noticeId) {
        Notice notice = noticeRepository.findById(noticeId).orElse(null);
        return doSend(storeId, memberId, noticeId, "NOTICE_UPDATED", "[공지] 공지 수정", notice);
    }

    // =========================
    // 3) 공통 실제 발송 로직
    // =========================

    private int doSend(Long storeId,
                       Long memberId,
                       Long noticeId,
                       String category,
                       String prefixTitle,
                       Notice noticeOrNull) {

        if (storeId == null) {
            log.warn("[NoticeAlert] storeId is null, skip send (noticeId={})", noticeId);
            return 0;
        }

        Notice notice = noticeOrNull;
        if (notice == null) {
            notice = noticeRepository.findById(noticeId).orElse(null);
        }
        if (notice == null) {
            log.warn("[NoticeAlert] notice not found id={}", noticeId);
            return 0;
        }

        // 🔔 제목/본문 정리
        String title = prefixTitle;
        if (notice.getTitle() != null && !notice.getTitle().isBlank()) {
            title = prefixTitle + " - " + notice.getTitle();
        }

        String body = notice.getBody();
        if (body == null) body = "";
        if (body.length() > 80) body = body.substring(0, 77) + "...";

        // 📍 이동 링크: 가맹점 프론트 공지 페이지
        String link = "/notice/list"; // Layout.navigateByLink에서 공지 페이지로 매핑

        // 🎯 토픽: store-{storeId}
        String topic = StoreTopic.store(storeId);

        String messageId = null;
        String error = null;

        try {
            // 기존 FcmService 활용 (payload + Webpush link 세팅)
            messageId = fcmService.sendHqNoticeToStores(topic, title, body, link);
        } catch (FirebaseMessagingException e) {
            error = e.getMessage();
            log.warn("[NoticeAlert] send fail storeId={} noticeId={}", storeId, noticeId, e);
        }

        // 📝 발송 로그 적재 (fcm_store_send_log)
        FcmStoreSendLog logRow = FcmStoreSendLog.builder()
                .appType(AppType.STORE)
                .category("NOTICE")
                .storeIdFk(storeId)
                .memberIdFk(memberId)
                .topic(topic)
                .title(title)
                .body(body)
                .link(link)
                .refType("NOTICE")
                .refId(noticeId)
                .sentAt(LocalDateTime.now())
                .resultMessageId(messageId)
                .resultError(error)
                .build();

        storeLogRepo.save(logRow);

        return (messageId != null ? 1 : 0);
    }
}
