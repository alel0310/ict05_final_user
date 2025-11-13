package com.boot.ict05_final_user.domain.fcm.dto;

import jakarta.validation.constraints.NotBlank;

/** 토픽 구독/해제 공용 DTO */
public record TopicRequest(@NotBlank String topic) { }
