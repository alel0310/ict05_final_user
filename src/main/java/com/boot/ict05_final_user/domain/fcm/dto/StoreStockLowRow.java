package com.boot.ict05_final_user.domain.fcm.dto;

import java.math.BigDecimal;

/**
 * 재고 부족 항목 읽기 전용 Row DTO.
 * - 본사 HqStockLowRow와 동일한 인터페이스 제공.
 */
public record StoreStockLowRow(
		Long materialId,
		String materialName,
		BigDecimal quantity,
		BigDecimal optimal
) {
	public BigDecimal deficit() {
		if (quantity == null || optimal == null) return BigDecimal.ZERO;
		return optimal.subtract(quantity);
	}
}
