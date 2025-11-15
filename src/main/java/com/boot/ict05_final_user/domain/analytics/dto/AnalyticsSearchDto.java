package com.boot.ict05_final_user.domain.analytics.dto;

import java.time.LocalDate;

public record AnalyticsSearchDto(
		LocalDate startDate, // 조회 시작일 (inclusive)
		LocalDate endDate,   // 조회 종료일 (inclusive, YYYY-MM-DD 그대로)
		ViewBy viewBy,       // DAY or MONTH
		Integer size,        // 50/100/150/200/300
		String cursor        // null or "YYYY-MM-DD" / "YYYY-MM"
) {
	public enum ViewBy { DAY, MONTH }
}
