package com.boot.ict05_final_user.domain.notice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NoticeListResponseDTO {
    private Page<NoticeListDTO> pageData;
    private NoticeCountDTO countData;
}
