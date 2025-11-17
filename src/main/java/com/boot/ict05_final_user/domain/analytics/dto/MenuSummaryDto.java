package com.boot.ict05_final_user.domain.analytics.dto;

import java.util.List;

public record MenuSummaryDto(
		List<MenuTopMenuDto> topMenusByQty,                 // 판매수량 Top3 메뉴
		List<MenuCategoryRankDto> topCategoriesBySales,     // 매출 Top3 카테고리
		List<MenuSalesContributionDto> topMenusBySalesContribution, // 매출 기여도 Top3 메뉴
		List<MenuLowPerformanceDto> lowPerformMenus         // 저성과 Top 메뉴(하위 3개)
) {}
