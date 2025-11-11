package com.boot.ict05_final_user.domain.notice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NoticeCountDTO {
    private long totalCount;
    private long urgentCount;
    private long importantCount;
    private long unreadCount; // 이 필드는 현재 로직상 0으로 유지됩니다.
}
