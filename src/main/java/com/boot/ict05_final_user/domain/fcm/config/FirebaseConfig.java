package com.boot.ict05_final_user.domain.fcm.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;

import java.io.InputStream;

/**
 * Firebase Admin SDK 초기화.
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class FirebaseConfig {

    private final FcmProperties props;
    private final ResourceLoader resourceLoader;

    @Bean
    public FirebaseApp firebaseApp() throws Exception {
        if (!props.isEnabled()) {
            log.warn("[FCM] disabled by config");
        }
        Resource resource = resourceLoader.getResource(props.getServiceAccount());
        try (InputStream in = resource.getInputStream()) {
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(in))
                    .build();
            // 앱 이름 충돌 방지
            return FirebaseApp.initializeApp(options, "store-app");
        }
    }

    @Bean
    public FirebaseMessaging firebaseMessaging(FirebaseApp app) {

        return FirebaseMessaging.getInstance(app);
    }
}
