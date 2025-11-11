package com.boot.ict05_final_user.domain.notice.service;

import com.boot.ict05_final_user.domain.notice.dto.NoticeCountDTO;
import com.boot.ict05_final_user.domain.notice.dto.NoticeListDTO;
import com.boot.ict05_final_user.domain.notice.dto.NoticeListResponseDTO;
import com.boot.ict05_final_user.domain.notice.dto.NoticeSearchDTO;
import com.boot.ict05_final_user.domain.notice.entity.Notice;
import com.boot.ict05_final_user.domain.notice.entity.NoticePriority;
import com.boot.ict05_final_user.domain.notice.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Service
@Transactional
@Slf4j
public class NoticeService {

    private final NoticeRepository noticeRepository;

    /**
     * 공지사항 목록을 페이지 단위로 조회하고, 중요도별 전체 카운트 정보를 함께 반환한다.
     *
     * @param noticeSearchDTO   검색 및 필터 조건
     * @param pageable 페이지 정보 (페이지 번호, 크기, 정렬)
     * @return 페이징 처리된 공지사항 리스트 DTO와 카운트 정보를 포함하는 응답 DTO
     */
    public NoticeListResponseDTO selectAllOfficeNotice(NoticeSearchDTO noticeSearchDTO, Pageable pageable) {
        Page<NoticeListDTO> pageData = noticeRepository.listNotice(noticeSearchDTO, pageable);

        long totalCount = noticeRepository.count(); // 전체 공지 개수
        long urgentCount = noticeRepository.countByPriority(NoticePriority.EMERGENCY);
        long importantCount = noticeRepository.countByPriority(NoticePriority.IMPORTANT);
        // unreadCount는 현재 백엔드에서 관리하지 않으므로 0으로 고정
        long unreadCount = 0;

        NoticeCountDTO countData = new NoticeCountDTO(totalCount, urgentCount, importantCount, unreadCount);

        return new NoticeListResponseDTO(pageData, countData);
    }

    /**
     * 공지사항 상세 정보를 조회하고 조회수를 1 증가시킨다.
     *
     * @param id 공지사항 ID
     * @return 공지사항 엔티티, 존재하지 않으면 null
     */
    public Notice detailNotice(Long id) {
        Notice notice = noticeRepository.findById(id).orElse(null);
        if (notice != null) {
            notice.incrementNoticeCount(); // 조회수 증가
            noticeRepository.save(notice); // 변경사항 저장
        }
        return notice;
    }

}
