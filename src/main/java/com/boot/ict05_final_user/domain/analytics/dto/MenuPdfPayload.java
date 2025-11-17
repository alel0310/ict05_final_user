package com.boot.ict05_final_user.domain.analytics.dto;

import java.util.List;
import java.util.Map;

/**
 * 메뉴 분석 PDF 페이로드.
 *
 * FastAPI MenuPayload(criteria + data[MenuRow]) 와 호환되는 구조.
 */
public record MenuPdfPayload(
        Map<String, Object> criteria,
        List<Map<String, Object>> data
) { }
