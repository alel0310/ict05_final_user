package com.boot.ict05_final_user.domain.analytics.dto;

/**
 * 메뉴 분석 - 카테고리 매출 TOP3 정보를 담는 DTO.
 *
 * <p>기간 내 카테고리별 매출 합계를 기준으로, 상위 3개 카테고리를 보여줄 때 사용한다.</p>
 */
public record MenuCategoryRankDto(
		Long categoryId,     // 카테고리 ID
		String categoryName, // 카테고리명
		long sales           // 매출액 합계
) {
}
