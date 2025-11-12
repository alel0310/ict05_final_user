package com.boot.ict05_final_user.domain.notice.dto;

import com.boot.ict05_final_user.domain.notice.entity.NoticePriority;
import lombok.Data;

@Data
public class NoticeSearchDTO {
    private String s;
    private String type;
    private String size = "10";
    private NoticePriority priority;
}