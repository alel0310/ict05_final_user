package com.boot.ict05_final_user.domain.fcm.dto;

import java.time.LocalDateTime;

/**
 * FCM 전송 로그 목록용 읽기 전용 Row DTO.
 * - 본사와 동일 필드 구성.
 */
public record FcmLogRowDto(
		Long id,
		String topic,
		String token,
		String title,
		String body,
		String resultMessageId,
		String resultError,
		LocalDateTime sentAt
) { }
