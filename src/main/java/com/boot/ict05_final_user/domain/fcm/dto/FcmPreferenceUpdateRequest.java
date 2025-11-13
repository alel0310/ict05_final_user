package com.boot.ict05_final_user.domain.fcm.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * 스토어 사용자의 FCM 수신 설정 변경 DTO.
 * - 본사와 동일 필드 구성.
 */
public record FcmPreferenceUpdateRequest(
		Boolean catNotice,
		Boolean catStockLow,
		Boolean catExpireSoon,
		@Min(1) @Max(30) Integer thresholdDays,
		Boolean applySubscriptions
) { }
