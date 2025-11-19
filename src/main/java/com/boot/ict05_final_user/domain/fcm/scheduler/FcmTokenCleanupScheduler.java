// src/main/java/com/boot/ict05_final_user/domain/fcm/scheduler/FcmTokenCleanupScheduler.java
package com.boot.ict05_final_user.domain.fcm.scheduler;

import com.boot.ict05_final_user.domain.fcm.repository.FcmDeviceTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "fcm.enabled", havingValue = "true")
public class FcmTokenCleanupScheduler {

	private final FcmDeviceTokenRepository tokenRepo;

	@Value("${fcm.cleanup.cron:0 0 3 * * *}")
	private String cron; // 참고용(로깅), 실제 스케줄은 @Scheduled의 expression 사용

	@Value("${fcm.cleanup.days-inactive:90}")
	private int daysInactive;

	@Transactional
	@Scheduled(cron = "${fcm.cleanup.cron:0 0 3 * * *}") // 기본: 매일 03:00
	public void cleanup() {
		LocalDateTime cutoff = LocalDateTime.now().minusDays(daysInactive);
		int deactivated = tokenRepo.deactivateAllByUpdatedAtBefore(cutoff);
		if (deactivated > 0) {
			log.info("[FCM] token cleanup by updatedAt cutoff={} deactivated={}", cutoff, deactivated);
		}
	}
}
