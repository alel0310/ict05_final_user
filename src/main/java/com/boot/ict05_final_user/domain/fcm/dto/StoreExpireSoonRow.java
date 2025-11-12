package com.boot.ict05_final_user.domain.fcm.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 유통임박 항목 읽기 전용 Row DTO.
 * - 본사 HqExpireSoonRow와 대응.
 */
public record StoreExpireSoonRow(
		Long materialId,
		String materialName,
		Long batchId,
		LocalDate expireDate,
		Integer daysLeft,
		BigDecimal quantity
) { }
