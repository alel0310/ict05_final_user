package com.boot.ict05_final_user.domain.analytics.dto;

import java.util.List;

/**
 * 메뉴 분석 상단 카드 영역을 위한 요약 DTO.
 *
 * <ul>
 *   <li>판매수량 TOP3 메뉴</li>
 *   <li>카테고리 매출 TOP3</li>
 *   <li>메뉴 평균 판매가 (기간 내 전체 메뉴매출 ÷ 전체 메뉴 판매수량)</li>
 *   <li>재고 소진률 TOP3 메뉴</li>
 * </ul>
 */
public record MenuSummaryDto(
		List<MenuTopMenuDto> topMenusByQty,        // 판매수량 TOP3 메뉴
		List<MenuCategoryRankDto> topCategoriesBySales, // 카테고리 매출 TOP3
		long avgMenuPrice,                         // 메뉴 평균 판매가 (가중 평균 단가, 원 단위)
		List<MenuDepletionDto> topMenusByDepletion // 재고 소진률 TOP3 메뉴
) {
}
