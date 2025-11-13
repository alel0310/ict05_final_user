package com.boot.ict05_final_user.domain.fcm.dto;

import lombok.*;

/**
 * 유통기한 임박 후보 항목 DTO(알림 생성 전 후보 데이터).
 * - 본사 HqExpireSoonCandidate와 대응.
 */
@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class StoreExpireSoonCandidate {
	private Long materialId;
	private String materialName;
	private String lot;
	private java.time.LocalDate expireDate;
	private Integer daysLeft;
}
