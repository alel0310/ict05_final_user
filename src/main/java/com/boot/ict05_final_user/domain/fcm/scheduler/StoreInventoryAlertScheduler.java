// src/main/java/com/boot/ict05_final_user/domain/fcm/scheduler/StoreInventoryAlertScheduler.java
package com.boot.ict05_final_user.domain.fcm.scheduler;

import com.boot.ict05_final_user.domain.fcm.config.StoreFcmScannerProperties;
import com.boot.ict05_final_user.domain.fcm.service.InventoryAlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * 가맹점 인벤토리 알림 스케줄러.
 * - fcm.scanner.enabled=true 일 때만 동작
 * - 크론/임계치/일수/상한은 application.properties로 제어
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "fcm.scanner.enabled", havingValue = "true")
public class StoreInventoryAlertScheduler {

    private final InventoryAlertService invService;
    private final StoreFcmScannerProperties props;

    /**
     * 재고부족 스캔/발송
     * 기본 크론: 20분마다 (0 0/20 * * * *)
     */
    @Scheduled(cron = "${fcm.scanner.low-cron:0 0/20 * * * *}")
    public void lowStockJob() {
        final int threshold = props.getLowThreshold();
        final int cap = props.getStockLowMax();

        int sent = invService.scanAndNotifyLowStock(threshold, cap);
        log.info("[Scheduler][INV_LOW] threshold={} cap={} sent={}", threshold, cap, sent);
    }

    /**
     * 유통임박 스캔/발송
     * 기본 크론: 매일 09:10 (0 10 9 * * *)
     */
    @Scheduled(cron = "${fcm.scanner.expire-cron:0 10 9 * * *}")
    public void expireSoonJob() {
        final LocalDate baseDate = LocalDate.now();
        final int days = props.getExpireSoonDaysDefault();
        final int cap = props.getExpireSoonMax();

        int sent = invService.scanAndNotifyExpireSoon(baseDate, days, cap);
        log.info("[Scheduler][EXP_SOON] baseDate={} days={} cap={} sent={}", baseDate, days, cap, sent);
    }
}
