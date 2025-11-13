package com.boot.ict05_final_user.domain.fcm.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.Map;

/** 테스트 발송용 DTO (토큰/토픽 공용) */
public record TestSendRequest(
		@NotBlank String tokenOrTopic,
		boolean topic,
		@NotBlank String title,
		@NotBlank String body,
		Map<String,String> data,
		String link   // 선택: data.link와 별개로 우선 적용
) { }
