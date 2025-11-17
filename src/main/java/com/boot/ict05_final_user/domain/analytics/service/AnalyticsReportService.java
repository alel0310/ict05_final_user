package com.boot.ict05_final_user.domain.analytics.service;

import com.boot.ict05_final_user.config.PythonPdfClient;
import com.boot.ict05_final_user.domain.analytics.dto.*;
import com.boot.ict05_final_user.domain.analytics.dto.TimeDayReportPayload;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

/**
 * 분석 리포트(PDF) 생성을 담당하는 서비스.
 *
 * - AnalyticsService 로부터 분석 데이터를 수집
 * - PythonPdfClient 를 통해 FastAPI로 PDF 생성 요청
 */
@Service
@RequiredArgsConstructor
public class AnalyticsReportService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final AnalyticsService analyticsService;
    private final PythonPdfClient pythonPdfClient;

    /**
     * 시간/요일 분석 보고서 PDF 생성.
     *
     * @param storeId   점포 ID
     * @param startDate 조회 시작일 (YYYY-MM-DD)
     * @param endDate   조회 종료일 (YYYY-MM-DD)
     * @return PDF 바이트 배열
     */
    public byte[] generateTimeDayReport(
            Long storeId,
            LocalDate startDate,
            LocalDate endDate,
            AnalyticsSearchDto.ViewBy viewBy
    ) {
        // 1) 상단 요약 / 차트는 기존 그대로
        TimeDaySummaryDto summary = analyticsService.getTimeDaySummary(storeId);

        List<TimeHourlyPointDto> hourlyPoints =
                analyticsService.getTimeDayHourlyChart(storeId, startDate, endDate);
        List<WeekdaySalesPointDto> weekdayPoints =
                analyticsService.getWeekdayChart(storeId, startDate, endDate);

        // 2) 테이블 데이터 (일별 or 월별)
        List<TimeDayDailyRowDto> dailyRows = List.of();
        List<TimeDayMonthlyRowDto> monthlyRows = List.of();

        if (viewBy == AnalyticsSearchDto.ViewBy.DAY) {
            AnalyticsSearchDto cond = new AnalyticsSearchDto(
                    startDate, endDate,
                    AnalyticsSearchDto.ViewBy.DAY,
                    500,
                    null
            );
            CursorPage<TimeDayDailyRowDto> page = analyticsService.getTimeDayDailyRows(storeId, cond);
            dailyRows = page.items();
        } else {
            AnalyticsSearchDto cond = new AnalyticsSearchDto(
                    startDate, endDate,
                    AnalyticsSearchDto.ViewBy.MONTH,
                    500,
                    null
            );
            CursorPage<TimeDayMonthlyRowDto> page = analyticsService.getTimeDayMonthlyRows(storeId, cond);
            monthlyRows = page.items();
        }

        // TODO: 나중에 StoreService에서 실제 점포명 가져오면 교체
        String storeName = "Store " + storeId;
        String periodLabel = startDate + " ~ " + endDate;
        String generatedAt = LocalDateTime.now(KST).toString();

        TimeDayReportPayload payload = new TimeDayReportPayload(
                storeId,
                storeName,
                periodLabel,
                summary,
                hourlyPoints,
                weekdayPoints,
                viewBy.name(),   // ✅ 어떤 모드인지 같이 보냄 ("DAY" / "MONTH")
                dailyRows,
                monthlyRows,
                generatedAt
        );

        return pythonPdfClient.requestTimeDayReport(payload);
    }

}
