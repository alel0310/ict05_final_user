package com.boot.ict05_final_user.domain.fcm.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/** 가맹점 인벤토리 알림 스캐너 설정 */
@Component
@ConfigurationProperties(prefix = "fcm.scanner")
@Getter @Setter
public class StoreFcmScannerProperties {
	/** 스케줄러 on/off */
	private boolean enabled = false;
	/** 크론 표현식 (예: 0 0/30 * * * *) */
	private String cron = "0 0/30 * * * *";

	/** 안전장치(최대 행수) */
	private int stockLowMax = 100;
	private int expireSoonMax = 100;

	/** 유통기한 임박 기준일 */
	private int expireSoonDaysDefault = 3;

	/** 부족 임계치(수량) – 레거시 대비 기본값 */
	private int lowThreshold = 1;
}
