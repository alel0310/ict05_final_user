package com.boot.ict05_final_user.domain.fcm.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * FCM 관련 애플리케이션 설정 바인딩.
 */
@Component
@ConfigurationProperties(prefix = "fcm")
@Getter @Setter
public class FcmProperties {
    private boolean enabled = true;
    /** 서비스 계정 JSON 경로 (file:/..., classpath:...) */
    private String serviceAccount;
    private Webpush webpush = new Webpush();
    private int timeoutMs = 3000;

    @Getter @Setter
    public static class Webpush {
        /** 웹 푸시 기본 아이콘 경로 */
        private String defaultIcon = "/icons/icon-192.png";
    }
}
