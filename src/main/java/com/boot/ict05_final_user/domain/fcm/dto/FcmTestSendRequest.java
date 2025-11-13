package com.boot.ict05_final_user.domain.fcm.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.Map;

/**
 * 테스트 전송 요청 DTO (토픽 또는 토큰 대상).
 * - 본사와 동일하게 data 맵을 사용.
 * - link는 data.get("link")로 전달(서비스에서 null-safe 처리).
 */
public record FcmTestSendRequest(
		@NotBlank String tokenOrTopic,
		boolean topic,
		@NotBlank String title,
		@NotBlank String body,
		Map<String, String> data
) { }
