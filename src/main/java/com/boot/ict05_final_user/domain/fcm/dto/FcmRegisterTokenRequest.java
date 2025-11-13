package com.boot.ict05_final_user.domain.fcm.dto;

import com.boot.ict05_final_user.domain.fcm.entity.AppType;
import com.boot.ict05_final_user.domain.fcm.entity.PlatformType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * FCM 토큰 등록(업서트) 요청 DTO.
 * - 본사와 동일 형식. appType은 서버에서 STORE로 오버라이드 가능.
 */
public record FcmRegisterTokenRequest(
		@NotNull AppType appType,
		@NotNull PlatformType platform,
		@NotBlank String token,
		String deviceId,
		Long memberIdFk
) { }
