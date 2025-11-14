package com.boot.ict05_final_user.domain.staff.controller;

import com.boot.ict05_final_user.domain.staff.dto.AttendanceListDTO;
import com.boot.ict05_final_user.domain.staff.service.AttendanceService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
@Tag(name = "직원근태 API", description = "직원근태 등록/조회/수정 기능 제공")
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
}
