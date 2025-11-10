package com.boot.ict05_final_user.domain.analytics.dto;

/** KPI 테이블 한 행 (일별/월별 공용) */
public record KpiRowDto(
		String label,    // YYYY-MM-DD 또는 YYYY-MM
		long sales,      // 매출액 합
		long tx,         // 주문수 합
		double upt,      // 판매수량/주문수
		long ads,        // 매출/주문수 (객단가, 반올림)
		long aur         // 매출/판매수량 (단가, 반올림)
) {}
