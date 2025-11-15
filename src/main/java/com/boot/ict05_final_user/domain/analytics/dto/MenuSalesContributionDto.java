package com.boot.ict05_final_user.domain.analytics.dto;

/**
 * 메뉴별 매출 및 매출 기여도(%) 정보를 표현하는 DTO.
 */
public record MenuSalesContributionDto(
		Long menuId,
		String menuName,
		long sales,        // 기간 내 메뉴 매출 합계
		double salesShare  // 전체 메뉴 매출 대비 비율 (0~100, 소수점 1자리)
) {}
