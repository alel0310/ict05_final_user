package com.boot.ict05_final_user.domain.analytics.dto;

/**
 * 메뉴 분석 - 판매수량 TOP3 메뉴 정보를 담는 DTO.
 *
 * <p>기간 내 해당 매장에서 가장 많이 판매된 메뉴 3개(수량 기준)를 보여줄 때 사용한다.</p>
 */
public record MenuTopMenuDto(
		Long menuId,     // 메뉴 ID
		String menuName, // 메뉴명
		long quantity    // 판매 수량 합계
) {
}
