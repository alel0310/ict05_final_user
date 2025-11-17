package com.boot.ict05_final_user.domain.analytics.dto;

import java.util.List;
import java.util.Map;

/**
 * KPI PDF 생성을 위해 Python 서버로 전달하는 페이로드.
 *
 * FastAPI 쪽 KpiPayload(criteria + data[KpiRow]) 구조와 맞춘다.
 */
public record KpiPdfPayload(
        Map<String, Object> criteria,
        List<Map<String, Object>> data
) { }
