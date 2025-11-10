package com.boot.ict05_final_user.domain.purchaseOrder.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * 가맹점 ↔ 본사 발주/수주 상태 동기화 서비스
 *
 * <p>가맹점에서 상태 변경 시 본사로 동기화 전송,
 * 본사에서 상태 변경 시 가맹점 DB 업데이트를 처리한다.</p>
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class OrderSyncService {

    private final RestTemplate restTemplate;

    /**
     * 가맹점 → 본사 상태 동기화
     *
     * @param orderCode 발주 코드 (본사 수주 코드 동일)
     * @param status    변경된 상태 (예: RECEIVED, DELIVERED)
     */
    public void syncToHQ(String orderCode, String status) {
        String hqUrl = "http://localhost:8081/api/receive/sync/status";

        try {
            String fullUrl = hqUrl + "?orderCode=" + orderCode + "&status=" + status;
            log.info("🏪 [STORE → HQ] 상태 동기화 요청: {}", fullUrl);

            ResponseEntity<Void> response = restTemplate.exchange(fullUrl, HttpMethod.PUT, null, Void.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("✅ [STORE → HQ] 본사 상태 동기화 성공: {} → {}", orderCode, status);
            } else {
                log.warn("⚠️ [STORE → HQ] 본사 상태 동기화 실패: {} (HTTP {})",
                        orderCode, response.getStatusCodeValue());
            }

        } catch (Exception e) {
            log.error("🚨 [STORE → HQ] 상태 동기화 오류: {} → {}, {}", orderCode, status, e.getMessage());
        }
    }
}
