package com.boot.ict05_final_user.domain.analytics.dto;

/**
 * 주문 분석 월별 테이블 한 행 (월 단위 집계).
 */
public record OrderMonthlyRowDto(
		String yearMonth,      // YYYY-MM
		long totalSales,       // 총매출
		long orderCount,       // 주문수
		long avgOrderAmount,   // 평균주문금액 = totalSales / orderCount
		long deliverySales,    // 배달 매출
		long takeoutSales,     // 포장 매출
		long visitSales        // 매장 매출
) {
}
