package com.boot.ict05_final_user.domain.notice.service;

import com.boot.ict05_final_user.domain.notice.entity.NoticeAttachment;
import com.boot.ict05_final_user.domain.notice.repository.NoticeAttachmentRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@Transactional
public class NoticeAttachmentService {

    private final NoticeAttachmentRepository noticeAttachmentRepository;

    public NoticeAttachmentService(NoticeAttachmentRepository noticeAttachmentRepository) {
        this.noticeAttachmentRepository = noticeAttachmentRepository;
    }

    /**
     * 공지사항 ID를 기준으로 첨부파일 목록을 조회한다.
     *
     * @param noticeId 조회할 공지사항 ID
     * @return 해당 공지사항에 첨부된 파일 목록
     */
    public List<NoticeAttachment> findByNoticeId(Long noticeId) {
        List<NoticeAttachment> lists = noticeAttachmentRepository.findByNoticeId(noticeId);
        return lists;
    }
}
