package com.boot.ict05_final_user.domain.notice.repository;

import com.boot.ict05_final_user.domain.notice.dto.NoticeListDTO;
import com.boot.ict05_final_user.domain.notice.dto.NoticeSearchDTO;
import com.boot.ict05_final_user.domain.notice.entity.NoticePriority;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NoticeRepositoryCustom {
    Page<NoticeListDTO> listNotice(NoticeSearchDTO noticeSearchDTO, Pageable pageable);
    long countNotice(NoticeSearchDTO noticeSearchDTO);
    long countByPriority(NoticePriority priority);
}