// src/main/java/com/boot/ict05_final_user/domain/fcm/service/InventoryAlertService.java
package com.boot.ict05_final_user.domain.fcm.service;

import com.boot.ict05_final_user.domain.fcm.repository.InventoryAlertQueryRepository;
import com.google.firebase.messaging.FirebaseMessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * 재고부족/유통임박 스캐너 + 발사 연계 서비스.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryAlertService {

    private final InventoryAlertQueryRepository inventoryRepo;
    private final FcmService fcmService;

    /** 재고부족: 수량 threshold 미만인 점포에 발송 */
    @Transactional(readOnly = true)
    public int scanAndNotifyLowStock(int threshold) {
        List<Long> stores = inventoryRepo.findStoresWithLowStock(threshold);
        int count = 0;
        for (Long sid : stores) {
            try {
                fcmService.sendInventoryLow(sid, "[재고부족] 확인 필요", "일부 재료의 재고가 임계치 미만입니다.", "/user/inventory/low");
                count++;
            } catch (FirebaseMessagingException e) {
                log.warn("[FCM] INV_LOW send fail storeId={}", sid, e);
            }
        }
        return count;
    }

    /** 유통임박: today ~ today+days 에 속하는 점포에 발송 */
    @Transactional(readOnly = true)
    public int scanAndNotifyExpireSoon(LocalDate today, int days) {
        List<Long> stores = inventoryRepo.findStoresWithExpireSoon(today, days);
        int count = 0;
        for (Long sid : stores) {
            try {
                fcmService.sendExpireSoon(sid, "[유통임박] 확인 필요", "일부 재료의 유통기한이 임박했습니다.", "/user/inventory/expire");
                count++;
            } catch (FirebaseMessagingException e) {
                log.warn("[FCM] EXP_SOON send fail storeId={}", sid, e);
            }
        }
        return count;
    }
}
