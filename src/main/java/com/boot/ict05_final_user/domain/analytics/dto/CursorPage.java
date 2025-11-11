package com.boot.ict05_final_user.domain.analytics.dto;

import java.util.List;

/** [더보기] 커서 페이징 응답 */
public record CursorPage<T>(List<T> items, String nextCursor) {}
