package com.boot.ict05_final_user.domain.analytics.dto;

/**
 * 매출이 낮은(저성과) 메뉴 정보를 표현하는 DTO.
 */
public record MenuLowPerformanceDto(
		Long menuId,
		String menuName,
		long quantity,  // 기간 내 판매 수량 합계
		long sales      // 기간 내 매출 합계
) {}
