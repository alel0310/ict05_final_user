package com.boot.ict05_final_user.domain.notice.controller;

import com.boot.ict05_final_user.domain.notice.dto.NoticeListDTO;
import com.boot.ict05_final_user.domain.notice.dto.NoticeListResponseDTO;
import com.boot.ict05_final_user.domain.notice.dto.NoticeSearchDTO;
import com.boot.ict05_final_user.domain.notice.entity.Notice;
import com.boot.ict05_final_user.domain.notice.entity.NoticeAttachment;
import com.boot.ict05_final_user.domain.notice.service.NoticeAttachmentService;
import com.boot.ict05_final_user.domain.notice.service.NoticeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notice")
@Tag(name = "공지사항", description = "가맹점용 공지사항 API")
public class NoticeController {

    private final NoticeService noticeService;
    private final NoticeAttachmentService noticeAttachmentService;

    @GetMapping("/list")
    @Operation(summary = "공지사항 목록 조회", description = "가맹점에서 공지사항 목록을 조회합니다.")
    public ResponseEntity<NoticeListResponseDTO> getNoticeList(
            NoticeSearchDTO noticeSearchDTO,
            @PageableDefault(page = 1, size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {

        PageRequest pageRequest = PageRequest.of(pageable.getPageNumber() - 1, pageable.getPageSize(), Sort.by("id").descending());
        NoticeListResponseDTO response = noticeService.selectAllOfficeNotice(noticeSearchDTO, pageRequest);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/detail/{id}")
    @Operation(summary = "공지사항 상세 조회", description = "가맹점에서 공지사항 상세 내용을 조회합니다.")
    public ResponseEntity<Map<String, Object>> getNoticeDetail(@PathVariable Long id) {
        Notice notice = noticeService.detailNotice(id);
        if (notice == null) {
            return ResponseEntity.notFound().build();
        }
        List<NoticeAttachment> attachments = noticeAttachmentService.findByNoticeId(notice.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("notice", notice);
        response.put("attachments", attachments);

        return ResponseEntity.ok(response);
    }
}