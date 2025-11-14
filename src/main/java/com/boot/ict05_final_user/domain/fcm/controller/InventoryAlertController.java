package com.boot.ict05_final_user.domain.fcm.controller;

import com.boot.ict05_final_user.domain.fcm.service.InventoryAlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

/**
 * 운영 편의용 수동 트리거.
 */
@RestController
@RequestMapping("/fcm/inventory")
@RequiredArgsConstructor
public class InventoryAlertController {

    private final InventoryAlertService invService;

    /** 재고부족 수동 스캔 */
    @PostMapping("/scan/low")
    //@PreAuthorize("hasAnyRole('HQ','ADMIN')") // HQ가 눌러줄 수도 있음
    public Map<String, Object> scanLow(@RequestParam(defaultValue = "3") int threshold) {
        int sent = invService.scanAndNotifyLowStock(threshold);
        return Map.of("status", "ok", "threshold", threshold, "sent", sent);
    }

    /** 유통임박 수동 스캔 */
    @PostMapping("/scan/expire")
    //@PreAuthorize("hasAnyRole('HQ','ADMIN')")
    public Map<String, Object> scanExpire(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate base,
                                          @RequestParam(defaultValue = "3") int days) {
        int sent = invService.scanAndNotifyExpireSoon(base, days);
        return Map.of("status", "ok", "base", base.toString(), "days", days, "sent", sent);
    }
}
