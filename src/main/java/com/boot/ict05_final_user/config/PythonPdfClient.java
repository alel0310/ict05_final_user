package com.boot.ict05_final_user.config;

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

    // TODO: KPI / Orders / Menus 리포트도 완성되면 여기에 메서드 추가
}
