package com.boot.ict05_final_user.domain.analytics.dto;

/**
 * 메뉴 분석 - 월별 테이블 한 행 DTO.
 *
 * <p>특정 월(YYYY-MM) 기준으로, 메뉴/카테고리별 판매 지표와 랭킹 정보를 담는다.</p>
 */
public record MenuMonthlyRowDto(
		String yearMonth,    // 기준 월 (YYYY-MM)
		String menuName,     // 메뉴명
		String categoryName, // 카테고리명
		long quantity,       // 판매수량 합계
		long sales,          // 매출액 합계
		long orderCount      // 주문수 (해당 메뉴를 포함한 주문 건수)
) {
}
