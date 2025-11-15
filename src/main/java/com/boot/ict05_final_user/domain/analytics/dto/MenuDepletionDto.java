package com.boot.ict05_final_user.domain.analytics.dto;

/**
 * 메뉴 분석 - 재고 소진률 상위 메뉴 정보를 담는 DTO.
 *
 * <p>기간 내 원재료 소진량을 기준으로, 재고를 많이 사용하는(소진률이 높은) 메뉴 TOP3를 보여줄 때 사용한다.</p>
 */
public record MenuDepletionDto(
		Long menuId,        // 메뉴 ID
		String menuName,    // 메뉴명
		double depletionRate // 재고 소진률 (%), 0~100 범위, 소수 첫째 자리 반올림
) {
}
