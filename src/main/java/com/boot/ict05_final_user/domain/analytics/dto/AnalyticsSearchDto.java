package com.boot.ict05_final_user.domain.analytics.dto;

import java.time.LocalDate;

public record AnalyticsSearchDto(
		LocalDate startDate,
		LocalDate endDate,     // endExclusive (다음날 00:00)
		ViewBy viewBy,         // DAY or MONTH
		Integer size,          // 50/100/150/200/300
		String cursor          // null or "YYYY-MM-DD" / "YYYY-MM"
) {
	public enum ViewBy { DAY, MONTH }
}
