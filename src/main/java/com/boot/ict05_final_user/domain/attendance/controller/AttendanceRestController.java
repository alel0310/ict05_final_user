package com.boot.ict05_final_user.domain.attendance.controller;

import com.boot.ict05_final_user.config.security.principal.AppUser;
import com.boot.ict05_final_user.domain.attendance.dto.AttendanceListDTO;
import com.boot.ict05_final_user.domain.attendance.dto.AttendanceWriteFormDTO;
import com.boot.ict05_final_user.domain.attendance.service.AttendanceService;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "직원근태 API", description = "직원근태 조회/등록/수정/삭제 기능 제공")
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
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
            @RequestParam(defaultValue = "10") int size
    ) {

        Pageable pageable = PageRequest.of(page, size);

        log.info("📌 AttendanceRestController - 하루 근태 조회 요청: date={}, page={}, size={}",
                date, page, size);
        // Service에서 자동으로 로그인한 사용자의 storeId 가져감
        return attendanceService.getDailyAttendance(date, pageable);
    }

    /**
     * 직원 근태 등록 API
     * 근태 데이터를 저장하고 생성된 근태 ID를 반환한다.
     */
    @PostMapping("/add")
    public ResponseEntity<Long> addAttendance(
            @RequestBody AttendanceWriteFormDTO dto,
            @AuthenticationPrincipal AppUser user
    ) {
        log.info("POST /api/attendance/add dto={}, storeId={}", dto, user.getStoreId());

        // 근태 등록을 위한 서비스 호출
        Long attendanceId = attendanceService.createAttendance(dto, user.getStoreId());

        log.info("근태 등록 완료 id={}", attendanceId);
        return ResponseEntity.ok(attendanceId);  // 생성된 근태의 ID 반환
    }
    
}
