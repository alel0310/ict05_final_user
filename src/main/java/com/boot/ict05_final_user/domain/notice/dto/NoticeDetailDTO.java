package com.boot.ict05_final_user.domain.notice.dto;

import com.boot.ict05_final_user.domain.notice.entity.NoticeCategory;
import com.boot.ict05_final_user.domain.notice.entity.NoticePriority;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
public class NoticeDetailDTO {

    /** 공지사항 고유 ID */
    private Long id;

    /** 작성자(회원) FK */
    private Long memberIdFk;

    /** 공지사항 카테고리 */
    private NoticeCategory noticeCategory;

    /** 공지사항 우선순위 */
    private NoticePriority noticePriority;

    /** 공지사항 공개 여부 */
    private boolean isShow;

    /** 공지사항 제목 */
    private String title;

    /** 공지사항 내용 */
    private String body;

    /** 작성자 이름 */
    private String writer;

    /** 작성일시 */
    @Schema(type="string", format="date-time")
    private LocalDateTime registeredAt;
}
