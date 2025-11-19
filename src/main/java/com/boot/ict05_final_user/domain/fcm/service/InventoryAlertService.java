// src/main/java/com/boot/ict05_final_user/domain/fcm/service/InventoryAlertService.java
package com.boot.ict05_final_user.domain.fcm.service;

import com.boot.ict05_final_user.domain.fcm.repository.InventoryAlertQueryRepository;
import com.google.firebase.messaging.FirebaseMessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * 재고부족/유통임박 스캐너 + FCM 발사 연계 서비스.
 *
 * - 조회는 QueryDSL Repository에서 수행
 * - 발송 대상은 매장 단위 토픽(inv-low-{storeId}, expire-soon-{storeId})
 * - 예외는 로깅 후 계속 진행(개별 매장 실패가 전체 처리 중단을 막도록)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryAlertService {

    private final InventoryAlertQueryRepository inventoryRepo;
    private final FcmService fcmService;

    /**
     * 재고부족: 수량 threshold 미만인 점포에 발송
     * @param threshold 임계치(1 이상)
     * @return 성공 발송 매장 수
     */
    @Transactional(readOnly = true)
    public int scanAndNotifyLowStock(int threshold) {
        if (threshold <= 0) {
            log.warn("[FCM][INV_LOW] invalid threshold={}, force set to 1", threshold);
            threshold = 1;
        }

        List<Long> storeList = inventoryRepo.findStoresWithLowStock(threshold);
        // 혹시 중복 방지
        Set<Long> stores = new LinkedHashSet<>(storeList);

        int success = 0;
        for (Long storeId : stores) {
            try {
                // 성공 시에만 카운트
                fcmService.sendInventoryLow(
                        storeId,
                        "[재고부족] 확인 필요",
                        "일부 재료의 재고가 임계치 미만입니다.",
                        "/user/inventory/low"
                );
                success++;
            } catch (FirebaseMessagingException e) {
                // FcmService가 checked 예외를 노출하는 구현일 때 대비
                log.warn("[FCM][INV_LOW] send fail storeId={} code={}", storeId, e.getErrorCode(), e);
            } catch (RuntimeException e) {
                // FcmService가 RuntimeException으로 래핑하는 구현일 때 대비
                log.warn("[FCM][INV_LOW] send fail storeId={} err={}", storeId, e.getMessage(), e);
            }
        }

        log.info("[FCM][INV_LOW] threshold={} target={} success={}", threshold, stores.size(), success);
        return success;
    }

    /**
     * 유통임박: today ~ today+days 구간에 해당하는 점포에 발송
     * @param today 기준일(Asia/Seoul)
     * @param days  오늘로부터 며칠 후까지(0 이상)
     * @return 성공 발송 매장 수
     */
    @Transactional(readOnly = true)
    public int scanAndNotifyExpireSoon(LocalDate today, int days) {
        if (today == null) {
            today = LocalDate.now(); // 안전 기본값
        }
        if (days < 0) {
            log.warn("[FCM][EXP_SOON] invalid days={}, force set to 0", days);
            days = 0;
        }

        List<Long> storeList = inventoryRepo.findStoresWithExpireSoon(today, days);
        Set<Long> stores = new LinkedHashSet<>(storeList);

        int success = 0;
        for (Long storeId : stores) {
            try {
                fcmService.sendExpireSoon(
                        storeId,
                        today, // baseDate 기록 용도
                        "[유통임박] 확인 필요",
                        "일부 재료의 유통기한이 임박했습니다.",
                        "/user/inventory/expire"
                );
                success++;
            } catch (FirebaseMessagingException e) {
                log.warn("[FCM][EXP_SOON] send fail storeId={} code={}", storeId, e.getErrorCode(), e);
            } catch (RuntimeException e) {
                log.warn("[FCM][EXP_SOON] send fail storeId={} err={}", storeId, e.getMessage(), e);
            }
        }

        log.info("[FCM][EXP_SOON] baseDate={} days={} target={} success={}",
                today, days, stores.size(), success);
        return success;
    }

    // (옵션) 상한 적용 버전이 필요하면 아래 오버로드를 사용하세요.
    @Transactional(readOnly = true)
    public int scanAndNotifyLowStock(int threshold, int maxTargets) {
        if (threshold <= 0) threshold = 1;
        List<Long> list = inventoryRepo.findStoresWithLowStock(threshold);
        if (maxTargets > 0 && list.size() > maxTargets) {
            list = list.subList(0, maxTargets);
        }
        int n = 0;
        for (Long sid : new LinkedHashSet<>(list)) {
            try {
                fcmService.sendInventoryLow(sid, "[재고부족] 확인 필요",
                        "일부 재료의 재고가 임계치 미만입니다.", "/user/inventory/low");
                n++;
            } catch (Exception e) {
                log.warn("[FCM][INV_LOW] send fail storeId={} err={}", sid, e.getMessage(), e);
            }
        }
        log.info("[FCM][INV_LOW] threshold={} capped={} success={}", threshold, list.size(), n);
        return n;
    }

    @Transactional(readOnly = true)
    public int scanAndNotifyExpireSoon(LocalDate today, int days, int maxTargets) {
        if (today == null) today = LocalDate.now();
        if (days < 0) days = 0;
        List<Long> list = inventoryRepo.findStoresWithExpireSoon(today, days);
        if (maxTargets > 0 && list.size() > maxTargets) {
            list = list.subList(0, maxTargets);
        }
        int n = 0;
        for (Long sid : new LinkedHashSet<>(list)) {
            try {
                fcmService.sendExpireSoon(sid, today, "[유통임박] 확인 필요",
                        "일부 재료의 유통기한이 임박했습니다.", "/user/inventory/expire");
                n++;
            } catch (Exception e) {
                log.warn("[FCM][EXP_SOON] send fail storeId={} err={}", sid, e.getMessage(), e);
            }
        }
        log.info("[FCM][EXP_SOON] baseDate={} days={} capped={} success={}", today, days, list.size(), n);
        return n;
    }
}
