package com.boot.ict05_final_user.domain.attendance.controller;

import com.boot.ict05_final_user.config.security.principal.AppUser;
import com.boot.ict05_final_user.domain.attendance.dto.*;
import com.boot.ict05_final_user.domain.attendance.service.AttendanceService;
import com.boot.ict05_final_user.domain.staff.entity.AttendanceStatus;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
@Tag(name = "직원근태 API", description = "직원근태 조회/등록/수정/삭제 기능 제공")
public class AttendanceRestController {

    private final AttendanceService attendanceService;

    /**
     * 로그인한 가맹점주의 매장의 특정 날짜 하루 근태 조회 (페이징)
     *
     * GET /api/attendance/daily?date=2025-11-25&page=0&size=10
     */
    @GetMapping("/daily")
    public Page<AttendanceListDTO> getDailyAttendance(
            @RequestParam("date")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) AttendanceStatus attendanceStatus
    ) {
        Pageable pageable = PageRequest.of(page, size);

        AttendanceSearchDTO searchDto = new AttendanceSearchDTO();
        searchDto.setKeyword(keyword);
        searchDto.setType(type);
        searchDto.setAttendanceStatus(attendanceStatus);

        log.info("📌 AttendanceRestController - 하루 근태 조회: date={}, page={}, size={}, keyword={}, type={}, status={}",
                date, page, size, keyword, type, attendanceStatus);

        // Service에서 자동으로 로그인한 사용자의 storeId 가져감
        return attendanceService.getDailyAttendance(date, pageable, searchDto);
    }

    /**
     * 직원 근태 등록 API
     * 근태 데이터를 저장하고 생성된 근태 ID를 반환한다.
     */
    @PostMapping("/add")
    public ResponseEntity<Long> addAttendance(
            @Valid @RequestBody AttendanceWriteFormDTO dto,
            @AuthenticationPrincipal AppUser user
    ) {
        log.info("POST /api/attendance/add dto={}, storeId={}", dto, user.getStoreId());

        // 근태 등록을 위한 서비스 호출
        Long attendanceId = attendanceService.createAttendance(dto, user.getStoreId());

        log.info("근태 등록 완료 id={}", attendanceId);
        return ResponseEntity.ok(attendanceId);  // 생성된 근태의 ID 반환
    }

    /**
     * 근태 상세 조회
     * GET /api/attendance/detail/{attendanceId}
     */
    @GetMapping("/detail/{attendanceId}")
    public ResponseEntity<AttendanceDetailDTO> getAttendanceDetail(
            @PathVariable Long attendanceId
    ) {
        log.info("📌 AttendanceRestController - 근태 상세 조회: id={}", attendanceId);
        AttendanceDetailDTO detail = attendanceService.getAttendanceDetail(attendanceId);
        return ResponseEntity.ok(detail);
    }

    /**
     * 근태 수정 폼 조회
     * GET /api/attendance/modify/{attendanceId}
     */
    @GetMapping("/modify/{attendanceId}")
    public ResponseEntity<AttendanceModifyFormDTO> getAttendanceModifyForm(
            @PathVariable Long attendanceId,
            @AuthenticationPrincipal AppUser user
    ) {
        log.info("📌 AttendanceRestController - 근태 수정 폼 조회: id={}, storeId={}", attendanceId, user.getStoreId());
        AttendanceModifyFormDTO dto = attendanceService.getAttendanceModifyForm(attendanceId);
        return ResponseEntity.ok(dto);
    }

    /**
     * 근태 수정 저장
     * PUT /api/attendance/modify/{attendanceId}
     */
    @PutMapping("/modify/{attendanceId}")
    public ResponseEntity<Void> updateAttendance(
            @PathVariable Long attendanceId,
            @Valid @RequestBody AttendanceModifyFormDTO dto,
            @AuthenticationPrincipal AppUser user
    ) {
        log.info("📌 AttendanceRestController - 근태 수정 요청: pathId={}, dto={}, storeId={}",
                attendanceId, dto, user.getStoreId());

        dto.setAttendanceId(attendanceId);  // path 변수를 DTO에 세팅
        attendanceService.modifyAttendance(dto);
        return ResponseEntity.ok().build();
    }

    /**
     * 특정 직원의 특정 날짜 근태 전체 삭제
     * DELETE /api/attendance/daily/staff?date=2025-11-25&staffId=123
     */
    @DeleteMapping("/daily/staff")
    public ResponseEntity<Void> deleteDailyAttendanceForStaff(
            @RequestParam("date")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam("staffId") Long staffId,
            @AuthenticationPrincipal AppUser user
    ) {
        log.info("🗑️ DELETE /api/attendance/daily/staff?date={}&staffId={} (storeId={})",
                date, staffId, user != null ? user.getStoreId() : null);

        attendanceService.deleteDailyAttendanceForStaff(staffId, date);
        return ResponseEntity.noContent().build(); // 204
    }
}
