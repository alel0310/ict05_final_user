package com.boot.ict05_final_user.domain.fcm.dto;

import com.boot.ict05_final_user.domain.fcm.entity.PlatformType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 가맹점(스토어) 단의 FCM 토큰 업서트용 DTO.
 * - 서버에서 appType=STORE로 강제 셋업하므로 appType은 받지 않는다.
 */
public record TokenUpsertRequest(
		@NotBlank String token,
		@NotNull PlatformType platform,
		String deviceId
) { }
