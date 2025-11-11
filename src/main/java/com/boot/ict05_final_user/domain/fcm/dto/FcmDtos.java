package com.boot.ict05_final_user.domain.fcm.dto;


import com.boot.ict05_final_user.domain.fcm.entity.PlatformType;

/**
 * FCM 컨트롤러 요청/응답 DTO 모음.
 */
public class FcmDtos {
    /** 토큰 업서트 요청 */
    public record TokenUpsertReq(String token, PlatformType platform, String deviceId) {}
    /** 토픽 구독/해제 요청 */
    public record TopicReq(String topic) {}
    /** 테스트 전송 요청 */
    public record SendTestReq(String tokenOrTopic, boolean topic, String title, String body, String link) {}
}