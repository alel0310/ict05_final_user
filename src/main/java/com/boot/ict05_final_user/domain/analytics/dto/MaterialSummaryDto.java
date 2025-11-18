package com.boot.ict05_final_user.domain.analytics.dto;

import java.util.List;

/**
 * 재료 분석 상단 요약 카드 DTO.
 *
 * <p>기간 정의</p>
 * <ul>
 *   <li>MTD(이번달): today 기준, {@code thisMonthStart = today.withDayOfMonth(1)}</li>
 *   <li>집계 기간: [thisMonthStart 00:00, today 00:00) → "이번달 1일 ~ 어제까지"</li>
 *   <li>전월 비교: {@code prevMonthStart = thisMonthStart.minusMonths(1)}</li>
 *   <li>전월 종료일: 전월 말일과 (오늘-1일)의 일자 중 작은 값 → "전월 1일 ~ 전월 동일 일자까지"</li>
 * </ul>
 *
 * <p>원가율 정의</p>
 * <ul>
 *   <li>원가율 = (재료 원가 합계 ÷ 매출 합계) × 100</li>
 *   <li>{@code currentCostRate}와 {@code prevCostRate}는 0~100 범위의 퍼센트 값(소수점 1자리)으로 표현</li>
 *   <li>{@code costRateDiff} = currentCostRate - prevCostRate (퍼센트 포인트)</li>
 * </ul>
 */
public record MaterialSummaryDto(

        // ------- 카드 1: 재료 Top 5 -------

        /**
         * 사용량 기준 Top 5 재료 리스트.
         *
         * <p>사용량 = 기간 내 총 소모량(기준 단위), 내림차순 정렬.</p>
         */
        List<MaterialTopItemDto> topByUsage,

        /**
         * 원가 기준 Top 5 재료 리스트.
         *
         * <p>원가 = 기간 내 재료 원가 합계, 내림차순 정렬.</p>
         */
        List<MaterialTopItemDto> topByCost,

        // ------- 카드 2: 재료 원가율 -------

        /**
         * 이번달 원가율 (0~100, 소수점 1자리).
         *
         * <p>기간: 이번달 1일 ~ 어제까지 MTD.</p>
         */
        double currentCostRate,

        /**
         * 전월 동일기간 원가율 (0~100, 소수점 1자리).
         *
         * <p>기간: 전월 1일 ~ 전월의 "어제와 같은 일자"까지. (말일이 더 작으면 말일까지)</p>
         */
        double prevCostRate,

        /**
         * 원가율 증감 (percentage point).
         *
         * <p>{@code currentCostRate - prevCostRate} 결과. 양수면 원가율 상승, 음수면 하락.</p>
         */
        double costRateDiff,

        // ------- 카드 3: 재고 부족 위험 -------

        /**
         * 재고 부족 위험 재료 수.
         *
         * <p>예시 기준:
         * <ul>
         *   <li>StoreInventory 또는 StoreMaterial 기준</li>
         *   <li>재고 수량 &lt; 안전 재고(safety stock) 이거나 InventoryStatus가 LOW/SHORTAGE 인 재료 수</li>
         * </ul>
         * 실제 기준은 Inventory 도메인 로직과 맞춰서 구현.</p>
         */
        long lowStockCount,

        // ------- 카드 4: 유통기한 임박 -------

        /**
         * 유통기한 임박 재료 수.
         *
         * <p>예시 기준:
         * <ul>
         *   <li>오늘 기준 N일 이내(예: 3일, 7일 등) 유통기한 도래</li>
         *   <li>InventoryAlertService에서 사용 중인 임박 기준과 동일하게 맞춰서 계산</li>
         * </ul>
         * 실제 임박 기준은 FCM 알림과 일관되게 구현.</p>
         */
        long expireSoonCount
) {
}
