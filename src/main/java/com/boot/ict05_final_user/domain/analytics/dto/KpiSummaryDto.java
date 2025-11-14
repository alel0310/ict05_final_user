package com.boot.ict05_final_user.domain.analytics.dto;

/**
 * KPI 요약 카드용 DTO.
 *
 * - Sales_MTD : 이번달 1일 ~ 어제까지 매출 합계
 * - Tx_MTD    : 이번달 1일 ~ 어제까지 주문 건수
 * - Units_MTD : 이번달 1일 ~ 어제까지 판매 수량 합계
 * - UPT_MTD   : Units_MTD / Tx_MTD
 * - ADS_MTD   : Sales_MTD / Tx_MTD
 * - AUR_MTD   : Sales_MTD / Units_MTD
 * - WoW%      : 최근 7일 vs 그 이전 7일 매출 증감률
 */
public record KpiSummaryDto(
		long salesMtd,      // ₩
		long txMtd,         // 건
		long unitsMtd,      // 판매 수량
		double uptMtd,      // 단위/건
		long adsMtd,        // ₩/건 (반올림)
		long aurMtd,        // ₩/단위 (반올림)
		Double wowPercent   // null 가능 (분모 0 보호)
) { }
