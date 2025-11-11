package com.boot.ict05_final_user.domain.notice.repository;

import com.boot.ict05_final_user.domain.notice.entity.NoticeAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NoticeAttachmentRepository extends JpaRepository<NoticeAttachment,Long> {
    List<NoticeAttachment> findByNoticeId(Long noticeId);
}
