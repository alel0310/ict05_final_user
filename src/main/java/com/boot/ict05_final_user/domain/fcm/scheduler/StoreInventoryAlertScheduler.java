package com.boot.ict05_final_user.domain.fcm.scheduler;

import com.boot.ict05_final_user.domain.fcm.service.InventoryAlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
// import org.springframework.scheduling.annotation.Scheduled;

import java.time.LocalDate;

/**
 * 가맹점 인벤토리 알림 스케줄러.
 * 검증 완료 후 @Scheduled 주석 해제.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class StoreInventoryAlertScheduler {

    private final InventoryAlertService invService;

    // @Scheduled(cron = "0 0/20 * * * *") // 20분마다 재고부족
    public void lowStockJob() {
        int sent = invService.scanAndNotifyLowStock(3);
        log.info("[Scheduler] LowStock sent={}", sent);
    }

    // @Scheduled(cron = "0 10 9 * * *") // 매일 09:10 유통임박
    public void expireSoonJob() {
        int sent = invService.scanAndNotifyExpireSoon(LocalDate.now(), 3);
        log.info("[Scheduler] ExpireSoon sent={}", sent);
    }
}
