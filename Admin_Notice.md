# Admin Notice Files

## /mnt/data/Workspace_IntelliJ/ict05_final/ict05_final_admin/src/main/java/com/boot/ict05_final_admin/domain/notice/controller/NoticeController.java
```java
package com.boot.ict05_final_admin.domain.notice.controller;

import com.boot.ict05_final_admin.config.ProjectAttribute;
import com.boot.ict05_final_admin.domain.notice.dto.NoticeListDTO;
import com.boot.ict05_final_admin.domain.notice.dto.NoticeSearchDTO;
import com.boot.ict05_final_admin.domain.notice.dto.NoticeWriteFormDTO;
import com.boot.ict05_final_admin.domain.notice.entity.Notice;
import com.boot.ict05_final_admin.domain.notice.entity.NoticeAttachment;
import com.boot.ict05_final_admin.domain.notice.entity.NoticeCategory;
import com.boot.ict05_final_admin.domain.notice.entity.NoticePriority;
import com.boot.ict05_final_admin.domain.notice.service.NoticeAttachmentService;
import com.boot.ict05_final_admin.domain.notice.service.NoticeService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.List;


/**
 * 관리자 공지사항 관리 컨트롤러
 * <p>
 * 공지사항 작성, 목록 조회, 상세 조회, 수정 화면을 제공한다.
 * 카테고리, 우선순위, 첨부파일 기능을 지원한다.
 */
@Controller
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;
    private final NoticeAttachmentService noticeAttachmentService;
    private final ProjectAttribute projectAttribute;

    /**
     * 공지사항 작성 화면을 표시한다.
     *
     * @param model 뷰에 전달할 모델 객체
     * @return 공지사항 작성 페이지 뷰 이름
     */
    @GetMapping("/notice/write")
    public String addOfficeNotice(Model model) {
        model.addAttribute("noticeWriteFormDTO", new NoticeWriteFormDTO());
        model.addAttribute("NoticeCategory", NoticeCategory.values());
        model.addAttribute("NoticePriority", NoticePriority.values());

        return "notice/write";
    }

    /**
     * 공지사항 목록을 페이징 처리하여 조회한다.
     *
     * @param noticeSearchDTO   (선택) 작성자 이름으로 검색할 경우 전달되는 값
     * @param pageable 페이지 번호, 크기, 정렬 조건을 포함한 페이징 객체
     * @param model    뷰에 전달할 모델 객체
     * @return 공지사항 목록 페이지 뷰 이름
     */
    @GetMapping("/notice/list")
    public String listOfficeNotice(NoticeSearchDTO noticeSearchDTO,
                                   @PageableDefault(page = 1, size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable,
                                   Model model,
                                   HttpServletRequest request) {

        PageRequest pageRequest = PageRequest.of(pageable.getPageNumber()-1, pageable.getPageSize(), Sort.by("id").descending());
        Page<NoticeListDTO> notices = noticeService.selectAllOfficeNotice(noticeSearchDTO, pageRequest);

        model.addAttribute("notices", notices);
        model.addAttribute("urlBuilder", ServletUriComponentsBuilder.fromRequest(request));
        model.addAttribute("noticeSearchDTO", noticeSearchDTO);

        return "notice/list";
    }

    /**
     * 특정 공지사항의 상세 내용을 조회한다.
     *
     * @param id    공지사항 ID
     * @param model 뷰에 전달할 모델 객체
     * @return 공지사항 상세 페이지 뷰 이름
     */
    @GetMapping("/notice/detail/{id}")
    public String detailOfficeNotice(@PathVariable Long id, Model model) {
        Notice notice = noticeService.detailNotice(id);
        List<NoticeAttachment> attachments = noticeAttachmentService.findByNoticeId(notice.getId());

        model.addAttribute("notice", notice);
        model.addAttribute("attachments", attachments);

        return "notice/detail";
    }

    /**
     * 특정 공지사항의 수정 화면을 표시한다.
     *
     * @param id    공지사항 ID
     * @param model 뷰에 전달할 모델 객체
     * @return 공지사항 수정 페이지 뷰 이름
     */
    @GetMapping("/notice/modify/{id}")
    public String modifyOfficeNotice(@PathVariable Long id, Model model) {
        Notice notice = noticeService.detailNotice(id);
        List<NoticeAttachment> attachments = noticeAttachmentService.findByNoticeId(id);

        model.addAttribute("notice", notice);
        model.addAttribute("NoticeCategory", NoticeCategory.values());
        model.addAttribute("NoticePriority", NoticePriority.values());
        model.addAttribute("attachments", attachments);

        return "notice/modify";
    }


    @GetMapping("/notice/delete/{id}")
    public String deleteOfficeNotice(@PathVariable Long id, Model model) {
        noticeService.deleteNotice(id);
        return "redirect:/notice/list";
    }



}
```

## /mnt/data/Workspace_IntelliJ/ict05_final/ict05_final_admin/src/main/java/com/boot/ict05_final_admin/domain/notice/controller/NoticeRestController.java
```java
package com.boot.ict05_final_admin.domain.notice.controller;

import com.boot.ict05_final_admin.domain.notice.dto.NoticeModifyFormDTO;
import com.boot.ict05_final_admin.domain.notice.dto.NoticeSearchDTO;
import com.boot.ict05_final_admin.domain.notice.entity.NoticeCategory;
import com.boot.ict05_final_admin.domain.notice.entity.NoticePriority;
import com.boot.ict05_final_admin.domain.notice.service.NoticeAttachmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import com.boot.ict05_final_admin.domain.notice.dto.NoticeWriteFormDTO;
import com.boot.ict05_final_admin.domain.notice.entity.Notice;
import com.boot.ict05_final_admin.domain.notice.service.NoticeService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 공지사항 관련 REST API 컨트롤러
 *
 * <p>이 컨트롤러는 다음과 같은 기능을 제공합니다:</p>
 * <ul>
 *     <li>공지사항 등록</li>
 *     <li>공지사항 수정</li>
 * </ul>
 *
 * <p>요청 시 첨부파일 업로드를 지원하며,
 * {@link NoticeWriteFormDTO}, {@link NoticeModifyFormDTO} 를 통해
 * 검증 및 데이터 바인딩을 수행합니다.</p>
 *
 * @author ICT
 * @since 2025.10
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/API")
@Tag(name = "공지사항 API", description = "공지사항 등록/조회/수정/삭제 기능 제공")
@Slf4j
public class NoticeRestController {

    private final NoticeService noticeService;
    private final NoticeAttachmentService noticeAttachmentService;

    /**
     * 공지사항 등록 API
     *
     * <p>본사에서 새로운 공지사항을 등록하는 엔드포인트입니다.
     * 첨부파일을 포함한 공지사항 데이터를 저장합니다.</p>
     *
     * @param dto 등록할 공지사항 데이터 (제목, 내용, 카테고리, 우선순위, 첨부파일 포함)
     * @param bindingResult 유효성 검증 결과
     * @return 등록 성공 여부 및 생성된 공지사항 ID
     * @throws Exception 파일 처리 오류 또는 DB 저장 오류
     */
    @PostMapping("/notice/write")
    @Operation(
            summary = "공지사항 등록",
            description = "본사에서 새로운 공지사항을 등록하는 API입니다. 첨부파일도 함께 업로드 가능합니다.",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "공지사항 등록 정보",
                    required = true
            ),
            responses = {
                    @io.swagger.v3.oas.annotations.responses.ApiResponse(
                            responseCode = "200",
                            description = "등록 성공",
                            content = @io.swagger.v3.oas.annotations.media.Content(
                                    mediaType = "application/json"
                            )
                    ),
                    @io.swagger.v3.oas.annotations.responses.ApiResponse(
                            responseCode = "400",
                            description = "검증 오류 발생"
                    )
            }
    )
    public ResponseEntity<Map<String, Object>> addOfficeNotice(
            @Validated @ModelAttribute NoticeWriteFormDTO dto,
            BindingResult bindingResult) throws Exception {

        if (bindingResult.hasErrors()) {
            Map<String, String> errors = bindingResult.getFieldErrors().stream()
                    .collect(Collectors.toMap(
                            fieldError -> fieldError.getField(),
                            fieldError -> fieldError.getDefaultMessage()
                    ));

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "success", false,
                            "errors", errors
                    ));
        }

        Long id = noticeService.insertOfficeNotice(dto, dto.getFiles());

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(Map.of(
                        "success", true,
                        "id", id
                ));
    }

    /**
     * 공지사항 수정 API
     *
     * <p>기존 공지사항을 수정하는 엔드포인트입니다.
     * 첨부파일 변경/추가도 함께 지원합니다.</p>
     *
     * @param dto 수정할 공지사항 데이터 (제목, 내용, 카테고리, 우선순위, 첨부파일 포함)
     * @param bindingResult 유효성 검증 결과
     * @return 수정 성공 여부 및 수정된 공지사항 ID
     * @throws Exception 파일 처리 오류 또는 DB 저장 오류
     */
    @PostMapping("/notice/modify")
    @Operation(
            summary = "공지사항 수정",
            description = "기존 공지사항을 수정하는 API입니다. 첨부파일 변경/추가도 가능합니다.",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "공지사항 수정 정보",
                    required = true
            ),
            responses = {
                    @io.swagger.v3.oas.annotations.responses.ApiResponse(
                            responseCode = "200",
                            description = "수정 성공",
                            content = @io.swagger.v3.oas.annotations.media.Content(
                                    mediaType = "application/json"
                            )
                    ),
                    @io.swagger.v3.oas.annotations.responses.ApiResponse(
                            responseCode = "400",
                            description = "검증 오류 발생"
                    )
            }
    )
    public ResponseEntity<Map<String, Object>> boardModify(
            @Validated @ModelAttribute NoticeModifyFormDTO dto,
            BindingResult bindingResult) throws Exception {

        if (bindingResult.hasErrors()) {
            Map<String, String> errors = bindingResult.getFieldErrors().stream()
                    .collect(Collectors.toMap(
                            fieldError -> fieldError.getField(),
                            fieldError -> fieldError.getDefaultMessage()
                    ));

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "success", false,
                            "errors", errors
                    ));
        }

        Long id = noticeService.noticeModify(dto, dto.getFiles()).getId();
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(Map.of(
                        "success", true,
                        "id", id
                ));
    }


    @PostMapping("/notice/delete/attachment")
    public ResponseEntity<Map<String, Object>> deleteAttachment(@RequestParam("id") Long id) {
        noticeAttachmentService.deleteAttachment(id);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(Map.of(
                        "success", true,
                        "id", id
                ));
    }


    @GetMapping("/notice/download")
    public ResponseEntity<?> downloadNotice(NoticeSearchDTO noticeSearchDTO,
                                            Pageable pageable) throws IOException {

        byte[] excelBytes = noticeService.downloadExcel(noticeSearchDTO, pageable);

        String filename = "공지사항.xlsx";
        String encodeFilename = java.net.URLEncoder.encode(filename, StandardCharsets.UTF_8).replaceAll("\+", "%20");

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=" + encodeFilename);
        headers.add("Cache-Control", "no-cache");

        return new ResponseEntity<>(excelBytes, headers, HttpStatus.OK);
    }

}
```

## /mnt/data/Workspace_IntelliJ/ict05_final/ict05_final_admin/src/main/java/com/boot/ict05_final_admin/domain/notice/dto/NoticeDetailDTO.java
```java
package com.boot.ict05_final_admin.domain.notice.dto;

import com.boot.ict05_final_admin.domain.notice.entity.NoticeCategory;
import com.boot.ict05_final_admin.domain.notice.entity.NoticePriority;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 공지사항 상세 정보 DTO
 *
 * <p>공지사항 상세 조회 시 사용되는 데이터 전송 객체(DTO)이다.</p>
 *
 * <p>주요 필드:</p>
 * <ul>
 *     <li>id: 공지사항 고유 ID</li>
 *     <li>noticeCategory: 공지사항 카테고리</li>
 *     <li>noticePriority: 공지사항 우선순위</li>
 *     <li>isShow: 공지사항 공개 여부</li>
 *     <li>title: 공지사항 제목</li>
 *     <li>body: 공지사항 내용</li>
 *     <li>writer: 작성자 이름</li>
 *     <li>writerdate: 작성일시</li>
 * </ul>
 */
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
```

## /mnt/data/Workspace_IntelliJ/ict05_final/ict05_final_admin/src/main/java/com/boot/ict05_final_admin/domain/notice/dto/NoticeListDTO.java
```java
package com.boot.ict05_final_admin.domain.notice.dto;

import com.boot.ict05_final_admin.domain.notice.entity.NoticeCategory;
import com.boot.ict05_final_admin.domain.notice.entity.NoticePriority;
import com.boot.ict05_final_admin.domain.notice.entity.NoticeStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 공지사항 목록 조회 DTO
 *
 * <p>공지사항 목록 조회 시 사용되는 데이터 전송 객체(DTO)이다.
 * 공지사항의 기본 정보와 작성일자를 포함하며, 작성일자는
 * 형식화된 문자열로 변환 가능하다.</p>
 *
 * <p>주요 필드:</p>
 * <ul>
 *     <li>id: 공지사항 고유 ID</li>
 *     <li>noticeCategory: 공지사항 카테고리</li>
 *     <li>noticePriority: 공지사항 우선순위</li>
 *     <li>isShow: 공지사항 공개 여부</li>
 *     <li>title: 공지사항 제목</li>
 *     <li>body: 공지사항 내용</li>
 *     <li>writer: 작성자 이름</li>
 *     <li>writerdate: 작성일시 (LocalDateTime)</li>
 * </ul>
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class NoticeListDTO {

    /**
     * 공지사항 고유 ID
     */
    private Long id;

    /**
     * 작성자(회원) FK
     */
    private Long memberIdFk;

    /**
     * 공지사항 카테고리
     */
    private NoticeCategory noticeCategory;

    /**
     * 공지사항 우선순위
     */
    private NoticePriority noticePriority;

    /**
     * 공지사항 상태
     */
    private NoticeStatus noticeStatus;

    /**
     * 공지사항 공개 여부
     */
    private boolean isShow;

    /**
     * 공지사항 제목
     */
    private String title;

    /**
     * 공지사항 내용
     */
    private String body;

    /**
     * 작성자 이름
     */
    private String writer;

    /**
     * 조회수
     */
    private Integer noticeCount;

    /**
     * 작성일시
     */
    @Schema(type = "string", format = "date-time")
    private LocalDateTime registeredAt;

    /**
     * 작성일자를 "yyyy.MM.dd" 형식의 문자열로 반환한다.
     * 작성일자가 null이면 빈 문자열을 반환한다.
     *
     * @return 형식화된 작성일자 문자열
     */
    public String getWriteDate() {
        if (registeredAt == null) return "";
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy.MM.dd");
        return registeredAt.format(formatter);
    }

    /** 한글 라벨: 상태 */
    public String getNoticeStatusLabel() {
        return noticeStatus != null ? noticeStatus.getDescription() : "";
    }

    /** 한글 라벨: 카테고리 */
    public String getNoticeCategoryLabel() {
        return noticeCategory != null ? noticeCategory.getDescription() : "";
    }

    /** 한글 라벨: 우선순위 */
    public String getNoticePriorityLabel() {
        return noticePriority != null ? noticePriority.getDescription() : "";
    }
}
```

## /mnt/data/Workspace_IntelliJ/ict05_final/ict05_final_admin/src/main/java/com/boot/ict05_final_admin/domain/notice/dto/NoticeModifyFormDTO.java
```java
package com.boot.ict05_final_admin.domain.notice.dto;

import com.boot.ict05_final_admin.domain.notice.entity.NoticeCategory;
import com.boot.ict05_final_admin.domain.notice.entity.NoticePriority;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 공지사항 수정 폼 DTO
 *
 * <p>공지사항 수정 시 클라이언트에서 전달되는 데이터 전송 객체(DTO)이다.
 * 기존 공지사항 ID, 카테고리, 우선순위, 제목, 내용, 작성자 및 첨부파일 리스트를 포함한다.</p>
 *
 * <p>주요 필드:</p>
 * <ul>
 *     <li>id: 수정할 공지사항의 고유 ID</li>
 *     <li>noticeCategory: 공지사항 카테고리</li>
 *     <li>noticePriority: 공지사항 우선순위</li>
 *     <li>isShow: 공지사항 공개 여부</li>
 *     <li>title: 공지사항 제목</li>
 *     <li>body: 공지사항 내용</li>
 *     <li>writer: 작성자 이름</li>
 *     <li>files: 새로 첨부할 파일 리스트 (없을 수 있음)</li>
 * </ul>
 */
@Data
public class NoticeModifyFormDTO {

    /** 수정할 공지사항의 고유 ID */
    private Long id;

    /** 수정할 작성자(회원) FK */
    private Long memberIdFk;

    /** 공지사항 카테고리 */
    @NotNull(message = "카테고리를 선택해주세요")
    private NoticeCategory noticeCategory;

    /** 공지사항 우선순위 */
    @NotNull(message = "상태를 선택해주세요")
    private NoticePriority noticePriority;

    /** 공지사항 공개 여부 */
    private Boolean isShow;

    /** 작성자 이름 */
    @NotBlank(message = "작성자를 입력해주세요")
    private String writer;

    /** 공지사항 제목 */
    @NotBlank(message = "제목을 입력해주세요")
    private String title;

    /** 공지사항 내용 */
    @NotBlank(message = "내용을 입력해주세요")
    private String body;

    /** 새로 첨부할 파일 리스트 */
    @Parameter(hidden = true)
    private List<MultipartFile> files;
}
```

## /mnt/data/Workspace_IntelliJ/ict05_final/ict05_final_admin/src/main/java/com/boot/ict05_final_admin/domain/notice/dto/NoticeSearchDTO.java
```java
package com.boot.ict05_final_admin.domain.notice.dto;

import lombok.Data;

@Data
public class NoticeSearchDTO {
    private String s;
    private String type;
    private String size = "10";
}
```

## /mnt/data/Workspace_IntelliJ/ict05_final/ict05_final_admin/src/main/java/com/boot/ict05_final_admin/domain/notice/dto/NoticeWriteFormDTO.java
```java
package com.boot.ict05_final_admin.domain.notice.dto;

import com.boot.ict05_final_admin.domain.notice.entity.NoticeCategory;
import com.boot.ict05_final_admin.domain.notice.entity.NoticePriority;
import com.boot.ict05_final_admin.domain.notice.entity.NoticeStatus;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 공지사항 등록 폼 DTO
 *
 * <p>공지사항 등록 시 클라이언트에서 전달되는 데이터 전송 객체(DTO)이다.
 * 공지사항의 카테고리, 우선순위, 공개여부, 작성자, 제목, 내용 및 첨부파일 리스트를 포함한다.</p>
 *
 * <p>검증 어노테이션:</p>
 * <ul>
 *     <li>@NotNull: 카테고리, 우선순위 필수</li>
 *     <li>@NotBlank: 작성자, 제목, 내용 필수</li>
 * </ul>
 *
 * <p>주요 필드:</p>
 * <ul>
 *     <li>noticeCategory: 공지사항 카테고리 (필수)</li>
 *     <li>noticePriority: 공지사항 우선순위 (필수)</li>
 *     <li>isShow: 공지사항 공개 여부</li>
 *     <li>writer: 작성자 이름 (필수)</li>
 *     <li>title: 공지사항 제목 (필수)</li>
 *     <li>body: 공지사항 내용 (필수)</li>
 *     <li>files: 첨부파일 리스트 (없을 수 있음)</li>
 * </ul>
 */
@Data
public class NoticeWriteFormDTO {

    /** 작성자(회원) FK */
    private Long memberIdFk;

    /** 공지사항 카테고리 (필수) */
    @NotNull(message = "카테고리를 선택해주세요")
    private NoticeCategory noticeCategory;

    /** 공지사항 우선순위 (필수) */
    @NotNull(message = "상태를 선택해주세요")
    private NoticePriority noticePriority;

    /** 공지사항 상태  */
    private NoticeStatus noticeStatus;

    /** 공지사항 공개 여부 */
    private Boolean isShow;

    /** 작성자 이름 (필수) */
    @NotBlank(message = "작성자를 입력해주세요")
    private String writer;

    /** 공지사항 제목 (필수) */
    @NotBlank(message = "제목을 입력해주세요")
    private String title;

    /** 공지사항 내용 (필수) */
    @NotBlank(message = "내용을 입력해주세요")
    private String body;

    /** 첨부파일 리스트 (없을 수 있음) */
    @Parameter(hidden = true)
    private List<MultipartFile> files;
}
```

## /mnt/data/Workspace_IntelliJ/ict05_final/ict05_final_admin/src/main/java/com/boot/ict05_final_admin/domain/notice/entity/Notice.java
```java
package com.boot.ict05_final_admin.domain.notice.entity;

import com.boot.ict05_final_admin.domain.notice.dto.NoticeModifyFormDTO;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 공지사항(Notice) 엔티티 클래스
 *
 * <p>본 클래스는 공지사항 테이블과 매핑되며,
 * 공지사항의 카테고리, 우선순위, 제목, 내용, 작성자, 작성일 등의 정보를 포함합니다.</p>
 *
 * <p>엔티티는 생성, 조회, 수정 기능을 지원하며,
 * {@link #updateNotice(NoticeModifyFormDTO)} 메서드를 통해 상태를 변경할 수 있습니다.</p>
 *
 * @author 김동관
 * @since 2025-09-30
 */
@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notice {

    /** 공지사항 고유 ID */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notice_id")
    private Long id;

    /** 작성자(회원) FK */
    @Column(name = "member_id_fk")
    private Long memberIdFk;

    /** 공지사항 카테고리 */
    @Enumerated(EnumType.STRING)
    @Column(name = "notice_category")
    private NoticeCategory noticeCategory;

    /** 공지사항 우선순위 */
    @Enumerated(EnumType.STRING)
    @Column(name = "notice_priority")
    private NoticePriority noticePriority;

    /** 공지사항 상태  */
    @Enumerated(EnumType.STRING)
    @Column(name = "notice_status")
    private NoticeStatus noticeStatus;

    /** 공지사항 노출 여부 */
    @Column(name = "is_show")
    private Boolean isShow;

    /** 작성자 이름 */
    @Column(name = "writer")
    private String writer;

    /** 공지사항 제목 */
    @Column(name = "notice_title")
    private String title;

    /** 공지사항 본문 내용 */
    @Column(name = "notice_content")
    private String body;

    /** 작성일자 */
    @Schema(type="string", format="date-time")
    @Column(name = "notice_reg_date")
    private LocalDateTime registeredAt;

    /** 조회수 */
    @Column(name = "notice_count")
    private Integer noticeCount;

    /** 확인 여부 (TINYINT(1) → Boolean) */
    @Column(name = "notice_confirmed")
    private Boolean noticeConfirmed;

    /**
     * 공지사항 정보를 수정하는 메서드
     *
     * <p>입력된 {@link NoticeModifyFormDTO} 객체의 데이터를 기준으로
     * 공지사항 엔티티의 상태를 변경합니다. 수정 시 작성일자는 현재 시간으로 갱신됩니다.</p>
     *
     * @param dto 수정할 공지사항 정보를 담고 있는 DTO 객체
     */
    public void updateNotice(NoticeModifyFormDTO dto) {
        this.noticeCategory   = dto.getNoticeCategory();
        this.noticePriority   = dto.getNoticePriority();
        this.isShow           = dto.getIsShow();
        this.title            = dto.getTitle();
        this.body             = dto.getBody();
        this.writer           = dto.getWriter();
        this.registeredAt     = LocalDateTime.now();
    }
}
```

## /mnt/data/Workspace_IntelliJ/ict05_final/ict05_final_admin/src/main/java/com/boot/ict05_final_admin/domain/notice/entity/NoticeAttachment.java
```java
package com.boot.ict05_final_admin.domain.notice.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 공지사항 첨부파일 엔티티
 *
 * <p>공지사항에 첨부된 파일 정보를 저장한다. 
 * 각 첨부파일은 고유 ID를 가지며, 해당 공지사항 ID와
 * 파일 URL을 포함한다.</p>
 *
 * <p>주요 필드:</p>
 * <ul>
 *     <li>id: 첨부파일 고유 ID (자동 생성)</li>
 *     <li>noticeId: 첨부파일이 연결된 공지사항 ID</li>
 *     <li>url: 첨부파일 접근 URL</li>
 * </ul>
 */
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
public class NoticeAttachment {

    /**
     * 첨부파일 고유 ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 첨부파일이 연결된 공지사항 ID
     */
    private Long noticeId;

    /**
     * 첨부파일 URL
     */
    private String url;
    /**
     * 원본 파일명
     */
    private String originalFilename;
}
```

## /mnt/data/Workspace_IntelliJ/ict05_final/ict05_final_admin/src/main/java/com/boot/ict05_final_admin/domain/notice/entity/NoticeCategory.java
```java
package com.boot.ict05_final_admin.domain.notice.entity;

/**
 * 공지사항 카테고리 Enum
 *
 * <p>공지사항의 분류를 정의하며, 각 항목은 한글 설명(description)을 가진다.</p>
 *
 * <p>주요 카테고리:</p>
 * <ul>
 *     <li>NORMAL: 일반 공지</li>
 *     <li>SYSTEM: 시스템 관련 공지</li>
 *     <li>EVENT: 이벤트 공지</li>
 *     <li>POLICY: 정책/공지사항</li>
 * </ul>
 */
public enum NoticeCategory {

    /** 일반 공지 */
    NORMAL("일반"),

    /** 시스템 관련 공지 */
    SYSTEM("시스템"),

    /** 이벤트 공지 */
    EVENT("이벤트"),

    /** 정책/공지사항 */
    POLICY("공지");

    /** 한글 설명 */
    private final String description;

    /**
     * 생성자
     *
     * @param description 각 카테고리의 한글 설명
     */
    NoticeCategory(String description) {
        this.description = description;
    }

    /**
     * 카테고리 한글 설명을 반환한다.
     *
     * @return 카테고리 설명
     */
    public String getDescription() {
        return description;
    }
}
```

## /mnt/data/Workspace_IntelliJ/ict05_final/ict05_final_admin/src/main/java/com/boot/ict05_final_admin/domain/notice/entity/NoticePriority.java
```java
package com.boot.ict05_final_admin.domain.notice.entity;

/**
 * 공지사항 우선순위 Enum
 *
 * <p>공지사항의 중요도를 정의하며, 각 항목은 한글 설명(description)을 가진다.</p>
 *
 * <p>주요 우선순위:</p>
 * <ul>
 *     <li>NORMAL: 일반 우선순위</li>
 *     <li>IMPORTANT: 중요 우선순위</li>
 *     <li>EMERGENCY: 긴급 우선순위</li>
 * </ul>
 */
public enum NoticePriority {

    /** 일반 우선순위 */
    NORMAL("일반"),

    /** 중요 우선순위 */
    IMPORTANT("중요"),

    /** 긴급 우선순위 */
    EMERGENCY("긴급");

    /** 한글 설명 */
    private final String description;

    /**
     * 생성자
     *
     * @param description 각 우선순위의 한글 설명
     */
    NoticePriority(String description) {
        this.description = description;
    }

    /**
     * 우선순위 한글 설명을 반환한다.
     *
     * @return 우선순위 설명
     */
    public String getDescription() {
        return description;
    }
}
```

## /mnt/data/Workspace_IntelliJ/ict05_final/ict05_final_admin/src/main/java/com/boot/ict05_final_admin/domain/notice/entity/NoticeStatus.java
```java
package com.boot.ict05_final_admin.domain.notice.entity;

/**
 * 공지사항 상태 Enum
 *
 * <p>공지사항의 상태를 정의하며, 각 항목은 한글 설명(description)을 가진다.</p>
 *
 * <p>주요 상태:</p>
 * <ul>
 *     <li>ACTIVE: 활성</li>
 *     <li>INACTIVE: 비활성</li>
 *     <li>DELETED: 삭제</li>
 * </ul>
 */
public enum NoticeStatus {

    /** 활성 상태 */
    ACTIVE("활성"),

    /** 비활성 상태 */
    INACTIVE("비활성"),

    /** 삭제 상태 */
    DELETED("삭제");

    /** 한글 설명(= DB ENUM 저장값) */
    private final String description;

    /**
     * 생성자
     *
     * @param description 각 상태의 한글 설명
     */
    NoticeStatus(String description) {
        this.description = description;
    }

    /**
     * 상태의 한글 설명을 반환한다.
     *
     * @return 상태 설명
     */
    public String getDescription() {
        return description;
    }
}
```

## /mnt/data/Workspace_IntelliJ/ict05_final/ict05_final_admin/src/main/java/com/boot/ict05_final_admin/domain/notice/repository/NoticeAttachmentRepository.java
```java
package com.boot.ict05_final_admin.domain.notice.repository;

import com.boot.ict05_final_admin.domain.notice.entity.NoticeAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NoticeAttachmentRepository extends JpaRepository<NoticeAttachment,Long> {
    List<NoticeAttachment> findByNoticeId(Long noticeId);
}
```

## /mnt/data/Workspace_IntelliJ/ict05_final/ict05_final_admin/src/main/java/com/boot/ict05_final_admin/domain/notice/repository/NoticeRepository.java
```java
package com.boot.ict05_final_admin.domain.notice.repository;

import com.boot.ict05_final_admin.domain.notice.dto.NoticeListDTO;
import com.boot.ict05_final_admin.domain.notice.entity.Notice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;


public interface NoticeRepository extends JpaRepository<Notice, Long>, NoticeRepositoryCustom {

}
```

## /mnt/data/Workspace_IntelliJ/ict05_final/ict05_final_admin/src/main/java/com/boot/ict05_final_admin/domain/notice/repository/NoticeRepositoryCustom.java
```java
package com.boot.ict05_final_admin.domain.notice.repository;

import com.boot.ict05_final_admin.domain.notice.dto.NoticeListDTO;
import com.boot.ict05_final_admin.domain.notice.dto.NoticeSearchDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NoticeRepositoryCustom {
    Page<NoticeListDTO> listNotice(NoticeSearchDTO noticeSearchDTO, Pageable pageable);
    long countNotice(NoticeSearchDTO noticeSearchDTO);
}
```

## /mnt/data/Workspace_IntelliJ/ict05_final/ict05_final_admin/src/main/java/com/boot/ict05_final_admin/domain/notice/repository/NoticeRepositoryImpl.java
```java
package com.boot.ict05_final_admin.domain.notice.repository;

import com.boot.ict05_final_admin.domain.notice.dto.NoticeSearchDTO;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import com.boot.ict05_final_admin.domain.notice.dto.NoticeListDTO;

import com.boot.ict05_final_admin.domain.notice.entity.QNotice;
import com.querydsl.core.types.Projections;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class NoticeRepositoryImpl implements NoticeRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Page<NoticeListDTO> listNotice(NoticeSearchDTO noticeSearchDTO, Pageable pageable) {
        QNotice notice = QNotice.notice;

        // 데이터 목록 조회
        List<NoticeListDTO> content = queryFactory
                .select(Projections.fields(NoticeListDTO.class,
                        notice.id,
                        notice.memberIdFk,
                        notice.noticeCategory,
                        notice.noticePriority,
                        notice.noticeStatus,
                        notice.isShow,
                        notice.title,
                        notice.body,
                        notice.writer,
                        notice.noticeCount,
                        notice.registeredAt
                        )) // member.name 매핑
                .from(notice)
                .where(
                        eqTitleOrBody(noticeSearchDTO, notice)
                )
                .orderBy(notice.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        // 전체 카운트 조회
        long total = queryFactory
                .select(notice.count())
                .from(notice)
                .where(
                        eqTitleOrBody(noticeSearchDTO, notice)
                )
                .fetchOne();

        return new PageImpl<>(content, pageable, total);
    }


    private BooleanExpression eqTitleOrBody(NoticeSearchDTO noticeSearchDTO, QNotice notice) {
        if (noticeSearchDTO.getType() == null || noticeSearchDTO.getS() == null) {
            return null; // 조건 없음
        }

        String keyword = noticeSearchDTO.getS();

        switch (noticeSearchDTO.getType()) {
            case "title":
                return notice.title.containsIgnoreCase(keyword);
            case "content":
                return notice.body.containsIgnoreCase(keyword);
            case "all": // title + body 모두 검색
                return notice.title.containsIgnoreCase(keyword)
                        .or(notice.body.containsIgnoreCase(keyword));
            default:
                return null;
        }
    }


    @Override
    public long countNotice(NoticeSearchDTO noticeSearchDTO) {
        QNotice notice = QNotice.notice;

        long total = queryFactory
                .select(notice.count())
                .from(notice)
                .where(
                        eqTitleOrBody(noticeSearchDTO, notice)
                )
                .fetchOne();

        return total;
    }
}
```

## /mnt/data/Workspace_IntelliJ/ict05_final/ict05_final_admin/src/main/java/com/boot/ict05_final_admin/domain/notice/service/NoticeAttachmentService.java
```java
package com.boot.ict05_final_admin.domain.notice.service;

import com.boot.ict05_final_admin.domain.notice.entity.NoticeAttachment;
import com.boot.ict05_final_admin.domain.notice.repository.NoticeAttachmentRepository;
import com.jcraft.jsch.Channel;
import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.*;

/**
 * 공지사항 첨부파일 관련 서비스 클래스
 *
 * <p>이 클래스는 다음 기능을 제공합니다:</p>
 * <ul>
 *     <li>SFTP 서버로 첨부파일 업로드</li>
 *     <li>공지사항 ID 기준 첨부파일 조회</li>
 * </ul>
 */
@Service
@Transactional
public class NoticeAttachmentService {

    private static final String SFTP_HOST = "ict05.wwwbiz.kr";
    private static final int SFTP_PORT = 22;
    private static final String SFTP_USER = "ict05";
    private static final String SFTP_PASSWORD = "admin*1472";
    private static final String SFTP_BASE_DIR = "/httpdocs/"; // 서버 내 업로드 경로
    private static final String URL_BASE = "http://ict05.wwwbiz.kr";

    private final NoticeAttachmentRepository noticeAttachmentRepository;

    public NoticeAttachmentService(NoticeAttachmentRepository noticeAttachmentRepository) {
        this.noticeAttachmentRepository = noticeAttachmentRepository;
    }

    /**
     * 첨부파일을 SFTP 서버에 업로드하고 접근 가능한 URL을 반환한다.
     *
     * <p>파일명은 UUID 기반으로 생성하며 원본 확장자를 유지한다.
     * 업로드 후 파일 URL을 반환하며, 업로드 실패 시 예외 발생.</p>
     *
     * @param file 업로드할 MultipartFile 객체
     * @return 업로드된 파일 URL
     * @throws Exception SFTP 연결 실패, 업로드 실패 등 예외 발생
     */
    public String uploadFile(MultipartFile file) throws Exception {
        Session session = null;
        Channel channel = null;
        ChannelSftp channelSftp = null;

        try {
            // JSCH 세션 생성
            JSch jsch = new JSch();
            session = jsch.getSession(SFTP_USER, SFTP_HOST, SFTP_PORT);
            session.setPassword(SFTP_PASSWORD);
            java.util.Properties config = new java.util.Properties();
            config.put("StrictHostKeyChecking", "no"); // 키 체크 비활성화
            session.setConfig(config);
            session.connect();

            // SFTP 채널 열기
            channel = session.openChannel("sftp");
            channel.connect();
            channelSftp = (ChannelSftp) channel;

            // 서버 디렉토리 이동 (없으면 생성)
            try {
                channelSftp.cd(SFTP_BASE_DIR);
            } catch (Exception e) {
                channelSftp.mkdir(SFTP_BASE_DIR);
                channelSftp.cd(SFTP_BASE_DIR);
            }

            // 파일 이름 생성 (UUID + 원본 확장자)
            String originalFilename = file.getOriginalFilename();
            String ext = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                ext = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String newFileName = UUID.randomUUID().toString() + ext;

            // 파일 업로드
            InputStream inputStream = file.getInputStream();
            channelSftp.put(inputStream, newFileName);
            inputStream.close();

            // 업로드된 URL 반환
            return URL_BASE + "/" + newFileName;

        } finally {
            if (channelSftp != null) channelSftp.exit();
            if (channel != null) channel.disconnect();
            if (session != null) session.disconnect();
        }
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


    public void deleteAttachment(Long id) {
        noticeAttachmentRepository.deleteById(id);
    }
}
```

## /mnt/data/Workspace_IntelliJ/ict05_final/ict05_final_admin/src/main/java/com/boot/ict05_final_admin/domain/notice/service/NoticeService.java
```java
package com.boot.ict05_final_admin.domain.notice.service;

import com.boot.ict05_final_admin.domain.notice.dto.NoticeListDTO;
import com.boot.ict05_final_admin.domain.notice.dto.NoticeModifyFormDTO;
import com.boot.ict05_final_admin.domain.notice.dto.NoticeSearchDTO;
import com.boot.ict05_final_admin.domain.notice.dto.NoticeWriteFormDTO;
import com.boot.ict05_final_admin.domain.notice.entity.Notice;
import com.boot.ict05_final_admin.domain.notice.entity.NoticeAttachment;
import com.boot.ict05_final_admin.domain.notice.entity.NoticeStatus;
import com.boot.ict05_final_admin.domain.notice.repository.NoticeAttachmentRepository;
import com.boot.ict05_final_admin.domain.notice.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 공지사항 관련 비즈니스 로직을 처리하는 서비스 클래스
 *
 * <p>공지사항 등록, 수정, 조회, 첨부파일 처리 등의 기능을 제공한다.</p>
 */
@RequiredArgsConstructor
@Service
@Transactional
@Slf4j
public class NoticeService {

    private final NoticeRepository noticeRepository;
    private final NoticeAttachmentRepository noticeAttachmentRepository;
    private final NoticeAttachmentService noticeAttachmentService;

    /**
     * 새로운 공지사항을 등록하고 첨부파일을 저장한다.
     *
     * @param dto   공지사항 등록 정보 (제목, 내용, 카테고리, 우선순위, 작성자 등)
     * @param files 첨부파일 리스트 (없을 수 있음)
     * @return 저장된 공지사항 ID
     * @throws Exception 파일 업로드 실패 시 예외 발생 가능
     */
    public Long insertOfficeNotice(NoticeWriteFormDTO dto, List<MultipartFile> files) throws Exception {
        Notice notice = Notice.builder()
                .memberIdFk(dto.getMemberIdFk())
                .noticeCategory(dto.getNoticeCategory())
                .noticePriority(dto.getNoticePriority())
                .noticeStatus(NoticeStatus.ACTIVE)
                .isShow(dto.getIsShow())
                .title(dto.getTitle())
                .body(dto.getBody())
                .writer(dto.getWriter())
                .registeredAt(LocalDateTime.now())
                .build();

        // DB 저장
        Notice saved = noticeRepository.save(notice);
        Long id = saved.getId();

        // 첨부파일 저장
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    String fileUrl = noticeAttachmentService.uploadFile(file); // S3, 로컬 등
                    NoticeAttachment attachment = new NoticeAttachment();
                    attachment.setNoticeId(saved.getId());
                    attachment.setUrl(fileUrl);
                    attachment.setOriginalFilename(file.getOriginalFilename());
                    noticeAttachmentRepository.save(attachment);
                }
            }
        }

        return id;
    }

    /**
     * 작성자 이름으로 필터링하여 공지사항 목록을 페이지 단위로 조회한다.
     *
     * @param noticeSearchDTO   작성자 이름 (선택, null 가능)
     * @param pageable 페이지 정보 (페이지 번호, 크기, 정렬)
     * @return 페이징 처리된 공지사항 리스트 DTO
     */
    public Page<NoticeListDTO> selectAllOfficeNotice(NoticeSearchDTO noticeSearchDTO, Pageable pageable) {
        return noticeRepository.listNotice(noticeSearchDTO, pageable);
    }

    /**
     * ID를 기준으로 공지사항을 조회한다.
     *
     * @param id 공지사항 ID
     * @return 공지사항 엔티티, 존재하지 않으면 null
     */
    public Notice findById(Long id) {
        return noticeRepository.findById(id).orElse(null);
    }

    /**
     * 기존 공지사항을 수정하고 첨부파일을 추가 저장한다.
     *
     * @param dto   수정할 공지사항 정보
     * @param files 첨부파일 리스트 (없을 수 있음)
     * @return 수정된 공지사항 엔티티
     * @throws Exception 파일 업로드 실패 시 예외 발생 가능
     */
    public Notice noticeModify(NoticeModifyFormDTO dto, List<MultipartFile> files) throws Exception {
        Notice notice = findById(dto.getId());
        if (notice == null) throw new IllegalArgumentException("게시물이 없습니다.");

        notice.updateNotice(dto);

        // 첨부파일 저장
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    String fileUrl = noticeAttachmentService.uploadFile(file); // S3, 로컬 등
                    NoticeAttachment attachment = new NoticeAttachment();
                    attachment.setNoticeId(notice.getId());
                    attachment.setUrl(fileUrl);
                    attachment.setOriginalFilename(file.getOriginalFilename());
                    noticeAttachmentRepository.save(attachment);
                }
            }
        }

        return notice;
    }

    /**
     * 공지사항 상세 정보를 조회한다.
     *
     * @param id 공지사항 ID
     * @return 공지사항 엔티티, 존재하지 않으면 null
     */
    public Notice detailNotice(Long id) {
        return noticeRepository.findById(id).orElse(null);
    }


    /**
     * 공지사항 id 를 받아 삭제하는 프로세스
     * @param id
     */
    public void deleteNotice(Long id) {
        noticeRepository.deleteById(id);
    }


    /**
     * 공지사항 액셀 다운로드
     * @return
     * @throws IOException
     */
    public byte[] downloadExcel(NoticeSearchDTO noticeSearchDTO, Pageable pageable)
            throws IOException {

        Workbook workbook = new XSSFWorkbook();

        Sheet sheet = workbook.createSheet("Sheet1");

        Row sheet_row = sheet.createRow(0);
        sheet_row.createCell(0).setCellValue("ID");
        sheet_row.createCell(1).setCellValue("제목");
        sheet_row.createCell(2).setCellValue("작성자");
        sheet_row.createCell(3).setCellValue("작성일");

        long count = noticeRepository.countNotice(noticeSearchDTO);
        PageRequest pageRequest = PageRequest.of(0, (int) count, Sort.by("id").descending());
        Page<NoticeListDTO> lists = noticeRepository.listNotice(noticeSearchDTO, pageRequest);

        int i = 1;
        for (NoticeListDTO notice : lists) {
            Row sheet1_row = sheet.createRow(i);
            sheet1_row.createCell(0).setCellValue(notice.getId());
            sheet1_row.createCell(1).setCellValue(notice.getTitle());
            sheet1_row.createCell(2).setCellValue(notice.getWriter());
            sheet1_row.createCell(3).setCellValue(notice.getRegisteredAt());
            i++;
        }

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        workbook.close();

        return outputStream.toByteArray();
    }
}
```

## /mnt/data/Workspace_IntelliJ/ict05_final/ict05_final_admin/src/main/resources/templates/notice/write.html
```html
<!doctype html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="format-detection" content="telephone=no">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex">
    <meta name="googlebot" content="noindex">
    <title>공지사항 작성</title>

    <!-- 공통 & 정적 리소스 (context-path 자동 포함) -->
    <th:block th:replace="~{fragments/head :: commonHead}"></th:block>
    <link th:href="@{/css/toast.css}" rel="stylesheet"/>
    <link th:href="@{/ckeditor/style.css}" rel="stylesheet"/>
    <link th:href="@{/ckeditor/ckeditor5.css}" rel="stylesheet"/>
    <script th:src="@{/js/lib/jquery-3.2.1.min.js}"></script>
    <script th:src="@{/js/toast.js}"></script>

    <!-- CKEditor CDN -->
    <script src="https://cdn.ckeditor.com/ckeditor5/41.2.1/classic/ckeditor.js"></script>
    <style>
        .ck-editor__editable:not(.ck-editor__nested-editable) { height: 450px; }
    </style>
</head>
<body>
<div id="wrap" class="frame">
    <div th:replace="~{fragments/header :: header}"></div>

    <div id="container" class="container">
        <!-- 타이틀바 -->
        <div class="title-bar">
            <h2 class="page-title ellipsis max-1132">공지사항 등록</h2>
        </div>

        <main id="content" class="max-1132">
            <div class="write-form box-wrap">
                <form name="frm" id="frm" th:object="${noticeWriteFormDTO}">
                    <fieldset class="pack-down gap-12">
                        <legend class="blind">공지 기본 정보</legend>

                        <!-- 1열: 카테고리 -->
                        <div class="field pack-down">
                            <label class="label medium required" for="noticeCategory">카테고리</label>
                            <div class="insert pack-down">
                                <select id="noticeCategory" class="select medium" th:field="*{noticeCategory}">
                                    <option value="">선택</option>
                                    <option th:each="c : ${NoticeCategory}"
                                            th:value="${c.name()}"
                                            th:text="${c.description}">일반</option>
                                </select>
                                <p id="noticeCategoryError" class="warning"></p>
                            </div>
                        </div>

                        <!-- 3열: 우선순위/노출/작성자 -->
                        <div class="row-3">
                            <div class="field pack-down col">
                                <label class="label medium required" for="noticePriority">우선순위</label>
                                <div class="insert pack-down">
                                    <select id="noticePriority" class="select medium" th:field="*{noticePriority}">
                                        <option value="">선택</option>
                                        <option th:each="p : ${NoticePriority}"
                                                th:value="${p.name()}"
                                                th:text="${p.description}">일반</option>
                                    </select>
                                    <p id="noticePriorityError" class="warning"></p>
                                </div>
                            </div>

                            <div class="field pack-down col">
                                <label class="label medium" for="isShow">노출여부</label>
                                <div class="insert pack-down">
                                    <label class="checkbox">
                                        <input type="checkbox" id="isShow" th:field="*{isShow}"/>
                                        <span>공개</span>
                                    </label>
                                    <p id="isShowError" class="warning"></p>
                                </div>
                            </div>

                            <div class="field pack-down col">
                                <label class="label medium required" for="writer">작성자</label>
                                <div class="insert pack-down">
                                    <input type="text" id="writer" class="input-text medium"
                                           th:field="*{writer}" title="작성자" placeholder="작성자 입력"/>
                                    <p id="writerError" class="warning"></p>
                                </div>
                            </div>
                        </div>

                        <!-- 제목 -->
                        <div class="field pack-down">
                            <label class="label medium required" for="title">제목</label>
                            <div class="insert pack-down">
                                <input type="text" id="title" class="input-text large"
                                       th:field="*{title}" title="제목" placeholder="제목 입력"/>
                                <p id="titleError" class="warning"></p>
                            </div>
                        </div>

                        <!-- 본문 -->
                        <div class="field pack-down">
                            <label class="label medium required" for="body">내용</label>
                            <div class="insert pack-down">
                                <textarea id="body" th:field="*{body}" class="body"></textarea>
                                <p id="bodyError" class="warning"></p>
                            </div>
                        </div>

                        <!-- 첨부 -->
                        <div class="field pack-down">
                            <label class="label medium" for="files">첨부파일</label>
                            <div class="insert pack-down">
                                <input type="file" id="files" th:field="*{files}" multiple/>
                            </div>
                        </div>

                        <!-- 저장 버튼 -->
                        <div class="button-area pack-center">
                            <button type="submit" class="btn large color1">저장</button>
                        </div>
                    </fieldset>
                </form>
            </div><!-- //.write-form.box-wrap -->

            <!-- 하단 버튼 -->
            <div class="button-area pack-both">
                <a th:href="@{/notice/list}" class="btn medium color1">목록</a>
            </div>
        </main>

        <div th:replace="~{fragments/footer :: footer}"></div>
    </div><!-- // #container -->
</div><!-- // #wrap -->

<!-- CKEditor & 제출 스크립트 (context-path 안전) -->
<script th:inline="javascript">
    // CKEditor 초기화
    ClassicEditor.create(document.querySelector(".body"), {
        language: "ko",
        ckfinder: {
            uploadUrl: /*[[ @{/image/upload} ]]*/ ''
        }
    }).catch(console.error);

    // 폼 제출
    document.getElementById("frm").addEventListener("submit", function (e) {
        e.preventDefault();
        const formData = new FormData(this);

        // 경고문구 초기화
        ["noticeCategory","noticePriority","isShow","writer","title","body"]
            .forEach(f => { const el = document.getElementById(f + "Error"); if (el) el.textContent = ""; });

        fetch(/*[[ @{/API/notice/write} ]]*/ '', {
            method: "POST",
            body: formData
        })
        .then(async (response) => {
            const data = await response.json();
            if (!response.ok) {
                if (response.status === 400 && data.errors) {
                    Object.keys(data.errors).forEach(field => {
                        const msg = data.errors[field];
                        const errorEl = document.getElementById(field + 'Error');
                        if (errorEl) errorEl.textContent = msg;
                    });
                }
                throw new Error("서버 검증 오류");
            } else {
                if (data && data.success) {
                    alert('저장 완료!');
                    const detailBase = /*[[ @{/notice/detail/} ]]*/ '';
                    window.location.href = detailBase + data.id; // /admin/notice/detail/{id}
                }
            }
        })
        .catch(err => console.error("에러 발생:", err));
    });
</script>
</body>
</html>
```

## /mnt/data/Workspace_IntelliJ/ict05_final/ict05_final_admin/src/main/resources/templates/notice/modify.html
```html
<!doctype html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="format-detection" content="telephone=no">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex">
    <meta name="googlebot" content="noindex">
    <title>공지사항 수정</title>

    <!-- 공통 헤드 & 자원 -->
    <th:block th:replace="~{fragments/head :: commonHead}"></th:block>
    <link th:href="@{/css/toast.css}" rel="stylesheet"/>
    <link th:href="@{/ckeditor/style.css}" rel="stylesheet"/>
    <link th:href="@{/ckeditor/ckeditor5.css}" rel="stylesheet"/>
    <script th:src="@{/js/lib/jquery-3.2.1.min.js}"></script>
    <script th:src="@{/js/toast.js}"></script>

    <!-- CKEditor CDN -->
    <script src="https://cdn.ckeditor.com/ckeditor5/41.2.1/classic/ckeditor.js"></script>
    <style>
        .ck-editor__editable:not(.ck-editor__nested-editable) { height: 450px; }
    </style>
</head>
<body>
<div id="wrap" class="frame">
    <div th:replace="~{fragments/header :: header}"></div>

    <div id="container" class="container">
        <!-- 타이틀바 -->
        <div class="title-bar">
            <h2 class="page-title ellipsis max-1132">
                <span th:text="${notice.title}">공지 제목</span> 수정
            </h2>
        </div>

        <main id="content" class="max-1132">
            <div class="write-form box-wrap">
                <form name="frm" id="frm">
                    <input type="hidden" name="id" id="id" th:value="${notice.id}"/>

                    <fieldset class="pack-down gap-12">
                        <legend class="blind">공지 기본 정보</legend>

                        <!-- 첫줄: 카테고리 / 우선순위 / 노출여부 -->
                        <div class="row col-3">
                            <div class="pack-down col">
                                <label class="fs-ss fc-999" for="noticeCategory">카테고리</label>
                                <div class="insert pack-down">
                                    <select name="noticeCategory" id="noticeCategory" class="select medium">
                                        <option value="">선택</option>
                                        <option th:each="c : ${NoticeCategory}"
                                                th:value="${c.name()}"
                                                th:text="${c.description}"
                                                th:selected="${c == notice.noticeCategory}">
                                            일반
                                        </option>
                                    </select>
                                    <p id="noticeCategoryError" class="warning"></p>
                                </div>
                            </div>

                            <div class="pack-down col">
                                <label class="fs-ss fc-999" for="noticePriority">우선순위</label>
                                <div class="insert pack-down">
                                    <select name="noticePriority" id="noticePriority" class="select medium">
                                        <option value="">선택</option>
                                        <option th:each="p : ${NoticePriority}"
                                                th:value="${p.name()}"
                                                th:text="${p.description}"
                                                th:selected="${p == notice.noticePriority}">
                                            일반
                                        </option>
                                    </select>
                                    <p id="noticePriorityError" class="warning"></p>
                                </div>
                            </div>

                            <div class="pack-down col">
                                <label class="fs-ss fc-999" for="isShow">노출여부</label>
                                <div class="insert pack-down">
                                    <label class="checkbox">
                                        <input type="checkbox" name="isShow" id="isShow"
                                               th:checked="${notice.isShow}" />
                                        <span>공개</span>
                                    </label>
                                    <p id="isShowError" class="warning"></p>
                                </div>
                            </div>
                        </div>

                        <!-- 작성자 -->
                        <div class="field pack-down">
                            <label class="label medium" for="writer">작성자</label>
                            <div class="insert pack-down">
                                <input type="text" name="writer" id="writer" class="input-text medium"
                                       th:value="${notice.writer}" title="작성자" placeholder="작성자 입력"/>
                                <p id="writerError" class="warning"></p>
                            </div>
                        </div>

                        <!-- 제목 -->
                        <div class="field pack-down">
                            <label class="label medium required" for="title">제목</label>
                            <div class="insert pack-down">
                                <input type="text" name="title" id="title" class="input-text large"
                                       th:value="${notice.title}" title="제목" placeholder="제목 입력"/>
                                <p id="titleError" class="warning"></p>
                            </div>
                        </div>

                        <!-- 본문 (CKEditor) -->
                        <div class="field pack-down">
                            <label class="label medium required" for="body">내용</label>
                            <div class="insert pack-down">
                                <textarea name="body" id="body" class="body" th:text="${notice.body}"></textarea>
                                <p id="bodyError" class="warning"></p>
                            </div>
                        </div>

                        <!-- 첨부 업로드 -->
                        <div class="field pack-down">
                            <label class="label medium" for="files">첨부파일</label>
                            <div class="insert pack-down">
                                <input type="file" name="files" id="files" multiple/>
                            </div>
                        </div>

                        <!-- 첨부 리스트 -->
                        <section class="pack-down">
                            <h3 class="fs-lg fw-600">첨부파일 목록</h3>
                            <table class="data-table" th:if="${attachments != null and !attachments.isEmpty()}">
                                <thead>
                                <tr>
                                    <th scope="col">파일명</th>
                                    <th scope="col" style="width:120px;">관리</th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr th:each="att : ${attachments}">
                                    <td>
                                        <a th:href="${att.url}" target="_blank"
                                           th:text="${att.originalFilename}">첨부파일명</a>
                                    </td>
                                    <td>
                                        <button type="button"
                                                class="btn small bdr-gray"
                                                th:onclick="deleteAttachment([[${att.id}]])">
                                            삭제
                                        </button>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                            <div class="fc-999 fs-sm" th:if="${attachments == null or attachments.isEmpty()}">
                                첨부파일이 없습니다.
                            </div>
                        </section>

                        <!-- 저장 버튼 -->
                        <div class="button-area pack-center">
                            <button type="submit" class="btn large color1">저장</button>
                        </div>
                    </fieldset>
                </form>
            </div><!-- //.write-form.box-wrap -->

            <!-- 하단 버튼 -->
            <div class="button-area pack-both">
                <a th:href="@{/notice/list}" class="btn medium color1">목록</a>
            </div>
        </main>

        <div th:replace="~{fragments/footer :: footer}"></div>
    </div><!-- // #container -->
</div><!-- // #wrap -->

<!-- CKEditor / 제출 / 첨부삭제 (context-path 안전) -->
<script th:inline="javascript">
    // CKEditor
    ClassicEditor.create(document.querySelector(".body"), {
        language: "ko",
        ckfinder: { uploadUrl: /*[[ @{/image/upload} ]]*/ '' }
    }).catch(console.error);

    // 제출
    document.getElementById("frm").addEventListener("submit", function (e) {
        e.preventDefault();

        const formData = new FormData(this);
        // 경고 초기화
        ["noticeCategory","noticePriority","isShow","writer","title","body"].forEach(f=>{
            const el = document.getElementById(f + "Error"); if (el) el.textContent = "";
        });

        fetch(/*[[ @{/API/notice/modify} ]]*/ '', {
            method: "POST",
            body: formData
        })
        .then(async (res) => {
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 400 && data && data.errors) {
                    Object.keys(data.errors).forEach(field => {
                        const msg = data.errors[field];
                        const el = document.getElementById(field + "Error");
                        if (el) el.textContent = msg;
                    });
                }
                throw new Error("서버 응답 오류");
            }
            alert("수정 성공 : " + (data && data.id ? data.id : ""));
            const base = /*[[ @{/notice/detail/} ]]*/ '';
            window.location.href = base + (data && data.id ? data.id : document.getElementById('id').value);
        })
        .catch(err => {
            console.error("에러 발생:", err);
            alert("수정 실패");
        });
    });

    // 첨부 삭제
    function deleteAttachment(attId) {
        const fd = new FormData();
        fd.append("id", attId);

        fetch(/*[[ @{/API/notice/delete/attachment} ]]*/ '', {
            method: "POST",
            body: fd
        })
        .then(async (res) => {
            const data = await res.json();
            if (!res.ok) throw new Error("삭제 실패");
            if (data && data.success) {
                // 현재 수정 페이지 새로고침
                window.location.href = /*[[ @{/notice/modify/{id}(id=${notice.id})} ]]*/ '';
            }
        })
        .catch(err => console.error(err));
    }
</script>
</body>
</html>
```

## /mnt/data/Workspace_IntelliJ/ict05_final/ict05_final_admin/src/main/resources/templates/notice/list.html
```html
<!doctype html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="format-detection" content="telephone=no">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex">
    <meta name="googlebot" content="noindex">
    <title>공지사항</title>

    <!-- 공통 헤드 & 자원 -->
    <th:block th:replace="~{fragments/head :: commonHead}"></th:block>
    <link href="/admin/css/toast.css" rel="stylesheet"/>
    <script src="/admin/js/lib/jquery-3.2.1.min.js"></script>
    <script src="/admin/js/toast.js"></script>
</head>
<body>
<div id="wrap" class="frame">
    <div th:replace="~{fragments/header :: header}"></div>

    <div id="container" class="container">
        <!-- 타이틀바 -->
        <div class="title-bar">
            <div class="pack-both">
                <h2 class="page-title ellipsis">공지사항</h2>
                <a href="/admin/notice/write" class="btn medium color1">글쓰기</a>
            </div>
        </div>

        <main id="content">
            <div class="box-wrap">
                <!-- 검색 영역 -->
                <div id="search" class="search">
                    <form name="frm" id="frm" method="get">
                        <fieldset>
                            <legend class="blind">검색</legend>
                            <div class="pack-both">
                                <div class="pack-left">
                                    <select name="type" class="select medium" title="검색유형">
                                        <option value="" 
                                                th:selected="${noticeSearchDTO.type == null or noticeSearchDTO.type == ''}">
                                            선택
                                        </option>
                                        <option value="title"   th:selected="${noticeSearchDTO.type == 'title'}">제목</option>
                                        <option value="content" th:selected="${noticeSearchDTO.type == 'content'}">내용</option>
                                        <option value="all"     th:selected="${noticeSearchDTO.type == 'all'}">제목 + 내용</option>
                                    </select>

                                    <input type="search" name="s" title="검색어"
                                           th:value="${noticeSearchDTO.s}"
                                           class="input-text medium form-control"
                                           placeholder="제목/내용 검색" />

                                    <input type="submit" value="검색" class="btn medium color1"/>
                                </div>

                                <div class="pack-left page-size">
                                    <select title="뷰사이즈"
                                            th:field="${noticeSearchDTO.size}"
                                            class="select medium"
                                            onchange="setPageSize(this.value)">
                                        <option value="10">10</option>
                                        <option value="30">30</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                    <span class="fs-ss">개씩 보기</span>
                                </div>
                            </div>
                        </fieldset>
                    </form>
                </div>

                <!-- 목록 액션 -->
                <section class="pack-down">
                    <div class="list-header pack-both">
                        <div class="pack-left"></div>
                        <div class="pack-right">
                            <button type="button" class="btn medium bdr-color2" onclick="excelDownload()">엑셀다운로드</button>
                        </div>
                    </div>

                    <!-- 테이블 -->
                    <table class="data-table">
                        <thead>
                        <tr>
                            <th scope="col"><input type="checkbox" id="selectAll"/></th>
                            <th scope="col">순번</th>
                            <th scope="col">ID</th>
                            <th scope="col">제목</th>
                            <th scope="col">작성자</th>
                            <th scope="col">작성일</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr th:each="notice, stat : ${notices.content}">
                            <td>
                                <input type="checkbox" class="row-checkbox"
                                       name="selectedIds"
                                       th:id="'chk-'+${stat.index}"
                                       th:value="${notice.id}"/>
                            </td>
                            <td th:text="${notices.totalElements - (notices.number * notices.size) - stat.index}">1</td>
                            <td th:text="${notice.id}">ID</td>
                            <td>
                                <a th:href="@{'/notice/detail/' + ${notice.id}}"
                                   th:text="${notice.title}">제목</a>
                            </td>
                            <td th:text="${notice.writer}">작성자</td>
                            <td th:text="${#temporals.format(notice.registeredAt, 'yyyy-MM-dd HH:mm')}">00.00.00</td>
                        </tr>
                        </tbody>
                    </table>

                    <!-- 페이지네이션 -->
                    <div style="text-align:center;">
                        <div th:replace="~{fragments/pagination :: pagination (${notices})}"></div>
                    </div>
                </section>
            </div>
        </main>

        <div th:replace="~{fragments/footer :: footer}"></div>
    </div>
</div>

<!-- 스크립트: 체크박스, 페이지사이즈, 엑셀다운로드 -->
<script>
    function setPageSize(size) {
        const params = new URLSearchParams(window.location.search);
        params.set('size', size);
        params.set('page', 1);
        window.location = `/admin/notice/list?${params.toString()}`;
    }

    function excelDownload() {
        const formData = new FormData(document.getElementById('frm'));
        const type = formData.get("type") || "";
        const s    = formData.get("s") || "";
        window.location = `/admin/API/notice/download?type=${encodeURIComponent(type)}&s=${encodeURIComponent(s)}`;
    }

    const selectAll = document.getElementById('selectAll');
    const getRowCheckboxes = () => Array.from(document.querySelectorAll('.row-checkbox'));

    function updateSelectAllState() {
        const all = getRowCheckboxes();
        if (all.length === 0) { selectAll.checked = false; selectAll.indeterminate = false; return; }
        const checkedCount = all.filter(cb => cb.checked).length;
        if (checkedCount === 0) { selectAll.checked = false; selectAll.indeterminate = false; }
        else if (checkedCount === all.length) { selectAll.checked = true; selectAll.indeterminate = false; }
        else { selectAll.checked = false; selectAll.indeterminate = true; }
    }

    if (selectAll) {
        selectAll.addEventListener('change', () => {
            const all = getRowCheckboxes();
            all.forEach(cb => cb.checked = selectAll.checked);
            selectAll.indeterminate = false;
        });
    }
    document.addEventListener('change', (e) => {
        if (!e.target.classList.contains('row-checkbox')) return;
        updateSelectAllState();
    });
    document.addEventListener('DOMContentLoaded', updateSelectAllState);
</script>
</body>
</html>
```

## /mnt/data/Workspace_IntelliJ/ict05_final/ict05_final_admin/src/main/resources/templates/notice/detail.html
```html
<!doctype html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="format-detection" content="telephone=no">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex">
    <meta name="googlebot" content="noindex">
    <title>공지사항 상세</title>

    <!-- 공통 리소스 -->
    <th:block th:replace="~{fragments/head :: commonHead}"></th:block>
    <link th:href="@{/css/toast.css}" rel="stylesheet"/>
    <script th:src="@{/js/lib/jquery-3.2.1.min.js}"></script>
    <script th:src="@{/js/toast.js}"></script>
</head>
<body>
<div id="wrap" class="frame">
    <div th:replace="~{fragments/header :: header}"></div>

    <div id="container" class="container">
        <!-- 타이틀바 -->
        <div class="title-bar">
            <h2 class="page-title ellipsis max-1132">
                <span th:text="${notice.title}">공지 제목</span>
                상세
            </h2>
        </div>

        <main id="content" class="max-1132">
            <div class="box-wrap">
                <!-- 상단 요약 -->
                <div class="pack-down gap-20">
                    <div class="pack-down gap-0">
                        <div>
                            <!-- 공개/비공개 배지 -->
                            <span th:class="'badge rounded-pill ' + (${notice.isShow} ? 'bg-success' : 'bg-secondary')"
                                  th:text="${notice.isShow} ? '공개' : '비공개'">상태</span>
                        </div>
                        <h3 class="fs-2xl fw-600 fc-333" th:text="${notice.title}">공지 제목</h3>
                    </div>

                    <!-- 1행: ID/카테고리/우선순위 -->
                    <div class="row col-3">
                        <div class="pack-down col">
                            <span class="fs-ss fc-999">ID</span>
                            <span th:text="${notice.id}">999</span>
                        </div>
                        <div class="pack-down col">
                            <span class="fs-ss fc-999">카테고리</span>
                            <span th:text="${notice.noticeCategory}">CATEGORY</span>
                        </div>
                        <div class="pack-down col">
                            <span class="fs-ss fc-999">우선순위</span>
                            <span th:text="${notice.noticePriority}">PRIORITY</span>
                        </div>
                    </div>

                    <!-- 2행: 작성자/작성일/노출여부 -->
                    <div class="row col-3">
                        <div class="pack-down col">
                            <span class="fs-ss fc-999">작성자</span>
                            <span th:text="${notice.writer}">writer</span>
                        </div>
                        <div class="pack-down col">
                            <span class="fs-ss fc-999">작성일</span>
                            <span th:text="${#temporals.format(notice.registeredAt, 'yyyy-MM-dd HH:mm')}">2025-01-01 00:00</span>
                        </div>
                        <div class="pack-down col">
                            <span class="fs-ss fc-999">노출</span>
                            <span th:text="${notice.isShow} ? 'Y' : 'N'">Y</span>
                        </div>
                    </div>
                </div>

                <!-- 본문 -->
                <div class="pack-down gap-12" style="margin-top: 8px;">
                    <span class="fs-ss fc-999">내용</span>
                    <div class="content-area" th:utext="${notice.body}">
                        Content
                    </div>
                </div>

                <!-- 첨부파일 -->
                <section class="pack-down" style="margin-top: 16px;">
                    <div class="pack-both">
                        <h3 class="fs-lg fw-600">첨부파일</h3>
                    </div>
                    <table class="data-table" th:if="${attachments != null and !attachments.isEmpty()}">
                        <thead>
                        <tr>
                            <th scope="col">파일명</th>
                            <th scope="col" style="width:120px;">관리</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr th:each="attachment : ${attachments}">
                            <td>
                                <a th:href="${attachment.url}" target="_blank"
                                   th:text="${attachment.originalFilename}">첨부파일명</a>
                            </td>
                            <td>
                                <button type="button"
                                        class="btn small bdr-gray"
                                        th:onclick="deleteAttachment([[${attachment.id}]])">
                                    삭제
                                </button>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                    <div class="fc-999 fs-sm" th:if="${attachments == null or attachments.isEmpty()}">첨부파일이 없습니다.</div>
                </section>

                <!-- 액션 버튼 -->
                <div class="button-area pack-both" style="margin-top: 20px;">
                    <div class="pack-left">
                        <a th:href="@{/notice/delete/{id}(id=${notice.id})}" class="btn medium bdr-color1">삭제</a>
                        <a th:href="@{/notice/modify/{id}(id=${notice.id})}" class="btn medium color1">수정</a>
                    </div>
                </div>
            </div><!-- //.box-wrap -->

            <!-- 하단 버튼 (목록 이동) -->
            <div class="button-area pack-both">
                <a th:href="@{/notice/list}" class="btn medium color1">목록</a>
                <a th:href="@{/notice/write}" class="btn medium color2">게시물작성</a>
            </div>
        </main>

        <div th:replace="~{fragments/footer :: footer}"></div>
    </div><!-- // #container -->
</div><!-- // #wrap -->

<!-- 첨부 삭제: context-path 안전 처리 -->
<script th:inline="javascript">
    function deleteAttachment(id) {
        const formData = new FormData();
        formData.append("id", id);

        fetch(/*[[ @{/API/notice/delete/attachment} ]]*/ '', {
            method: "POST",
            body: formData
        })
        .then(async (response) => {
            const data = await response.json();
            if (!response.ok) throw new Error("서버 검증 오류");
            if (data && data.success) {
                window.location.href = /*[[ @{/notice/detail/{id}(id=${notice.id})} ]]*/ '';
            }
        })
        .catch(err => console.error("에러 발생:", err));
    }
</script>
</body>
</html>
```