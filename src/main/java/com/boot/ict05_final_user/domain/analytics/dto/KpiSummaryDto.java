package com.boot.ict05_final_user.domain.analytics.dto;

/**
 * KPI 요약 카드 4개를 위한 DTO.
 * - Sales_MTD: 이번달 1일 ~ 어제 매출 합계
 * - Tx_MTD    : 이번달 1일 ~ 어제 주문 건수
 * - UPT/ADS/AUR (MTD 기준)
 * - WoW%      : 어제 기준 최근 7일 vs 그 이전 7일 매출 증감률
 */
public record KpiSummaryDto(
		long salesMtd,      // ₩
		long txMtd,         // 건
		double uptMtd,      // 단위/건
		long adsMtd,        // ₩/건 (반올림)
		long aurMtd,        // ₩/단위 (반올림)
		Double wowPercent   // null 가능 (분모 0 보호)
) { }
