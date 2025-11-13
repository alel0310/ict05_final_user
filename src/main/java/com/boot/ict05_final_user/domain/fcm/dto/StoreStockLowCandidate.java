package com.boot.ict05_final_user.domain.fcm.dto;

import lombok.*;

/**
 * 재고 부족 후보 항목 DTO(알림 생성 전 후보 데이터).
 * - 본사 HqStockLowCandidate와 대응.
 */
@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class StoreStockLowCandidate {
	private Long materialId;
	private String materialName;
	private Long qty;
	private Long threshold;
}
