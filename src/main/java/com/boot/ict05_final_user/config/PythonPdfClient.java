package com.boot.ict05_final_user.config;

import com.boot.ict05_final_user.domain.analytics.dto.KpiPdfPayload;
import com.boot.ict05_final_user.domain.analytics.dto.MenuPdfPayload;
import com.boot.ict05_final_user.domain.analytics.dto.OrdersPdfPayload;
import com.boot.ict05_final_user.domain.analytics.dto.TimeDayReportPayload;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

/**
 * Python FastAPI 기반 PDF 서버와 통신하는 클라이언트.
 *
 * <p>
 * - baseUrl: {@code pdf.python.base-url} (예: http://localhost:8001)<br/>
 * - 시간/요일 분석 리포트: POST /reports/time-day
 * </p>
 *
 * <p>
 * 동기(blocking) 방식으로 PDF 바이트 배열을 반환하며,
 * 오류 발생 시 IllegalStateException으로 래핑해서 던진다.
 * </p>
 */
@Component
@Slf4j
public class PythonPdfClient {

    private final WebClient webClient;

    public PythonPdfClient(
            @Value("${pdf.python.base-url}") String baseUrl,
            WebClient.Builder builder
    ) {
        this.webClient = builder
                .baseUrl(baseUrl)
                .build();
        log.info("[PythonPdfClient] baseUrl={}", baseUrl);
    }

    /**
     * 시간/요일 분석 리포트 PDF 생성 요청.
     *
     * @param payload 시간/요일 분석 페이로드
     * @return PDF 바이트 배열
     */
    public byte[] requestTimeDayReport(TimeDayReportPayload payload) {
        try {
            return webClient.post()
                    .uri("/pdf/time-day")
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .accept(MediaType.APPLICATION_PDF)
                    .body(BodyInserters.fromValue(payload))
                    .retrieve()
                    .bodyToMono(byte[].class)
                    .block();
        } catch (WebClientResponseException e) {
            log.error("[PythonPdfClient] time-day report 실패 status={} body={}",
                    e.getRawStatusCode(), e.getResponseBodyAsString(), e);
            throw new IllegalStateException("시간/요일 분석 PDF 생성 실패: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("[PythonPdfClient] time-day report 호출 중 예외", e);
            throw new IllegalStateException("시간/요일 분석 PDF 호출 중 예외 발생", e);
        }
    }

    /**
     * KPI 분석 리포트 PDF 생성 요청.
     */
    public byte[] requestKpiReport(KpiPdfPayload payload) {
        try {
            return webClient.post()
                    .uri("/pdf/kpi-report")
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .accept(MediaType.APPLICATION_PDF)
                    .body(BodyInserters.fromValue(payload))
                    .retrieve()
                    .bodyToMono(byte[].class)
                    .block();
        } catch (WebClientResponseException e) {
            log.error("[PythonPdfClient] kpi report 실패 status={} body={}",
                    e.getRawStatusCode(), e.getResponseBodyAsString(), e);
            throw new IllegalStateException("KPI PDF 생성 실패: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("[PythonPdfClient] kpi report 호출 중 예외", e);
            throw new IllegalStateException("KPI PDF 호출 중 예외 발생", e);
        }
    }

    /**
     * 주문 분석 리포트 PDF 생성 요청.
     */
    public byte[] requestOrdersReport(OrdersPdfPayload payload) {
        try {
            return webClient.post()
                    .uri("/pdf/orders")
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .accept(MediaType.APPLICATION_PDF)
                    .body(BodyInserters.fromValue(payload))
                    .retrieve()
                    .bodyToMono(byte[].class)
                    .block();
        } catch (WebClientResponseException e) {
            log.error("[PythonPdfClient] orders report 실패 status={} body={}",
                    e.getRawStatusCode(), e.getResponseBodyAsString(), e);
            throw new IllegalStateException("주문 분석 PDF 생성 실패: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("[PythonPdfClient] orders report 호출 중 예외", e);
            throw new IllegalStateException("주문 분석 PDF 호출 중 예외 발생", e);
        }
    }

    /**
     * 메뉴 분석 리포트 PDF 생성 요청.
     */
    public byte[] requestMenusReport(MenuPdfPayload payload) {
        try {
            return webClient.post()
                    .uri("/pdf/menus")
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .accept(MediaType.APPLICATION_PDF)
                    .body(BodyInserters.fromValue(payload))
                    .retrieve()
                    .bodyToMono(byte[].class)
                    .block();
        } catch (WebClientResponseException e) {
            log.error("[PythonPdfClient] menus report 실패 status={} body={}",
                    e.getRawStatusCode(), e.getResponseBodyAsString(), e);
            throw new IllegalStateException("메뉴 분석 PDF 생성 실패: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("[PythonPdfClient] menus report 호출 중 예외", e);
            throw new IllegalStateException("메뉴 분석 PDF 호출 중 예외 발생", e);
        }
    }

}
