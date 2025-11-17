package com.boot.ict05_final_user.domain.analytics.dto;

/**
 * 메뉴 분석 - 일별 테이블 한 행 DTO.
 *
 * <p>특정 일(YYYY-MM-DD) 기준으로, 메뉴/카테고리별 판매 지표를 집계한 결과를 담는다.</p>
 */
public record MenuDailyRowDto(
		String orderDate,    // 날짜 (YYYY-MM-DD)
		String categoryName, // 메뉴 카테고리명
		String menuName,     // 메뉴명
		long quantity,       // 판매수량 합계
		long sales,          // 매출액 합계
		long orderCount      // 주문수 (해당 메뉴를 포함한 주문 건수)
) {
}
