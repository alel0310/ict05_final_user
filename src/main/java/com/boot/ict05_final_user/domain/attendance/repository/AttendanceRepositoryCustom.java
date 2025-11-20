package com.boot.ict05_final_user.domain.attendance.repository;

import com.boot.ict05_final_user.domain.attendance.dto.AttendanceDetailDTO;
import com.boot.ict05_final_user.domain.attendance.dto.AttendanceListDTO;
import com.boot.ict05_final_user.domain.attendance.dto.AttendanceSearchDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.Optional;

public interface AttendanceRepositoryCustom {

    Page<AttendanceListDTO> findDailyAttendanceByStore(
            Long storeId, LocalDate workDate, Pageable pageable, AttendanceSearchDTO searchDto
    );

    Optional<AttendanceDetailDTO> findAttendanceDetailByIdAndStore(Long attendanceId, Long storeId);

    // 단건 삭제(이미 추가되어 있음)
    long deleteByIdAndStore(Long attendanceId, Long storeId);

    // ✅ 직원+날짜 일괄 삭제
    long deleteByStoreAndStaffAndWorkDate(Long storeId, Long staffId, LocalDate workDate);
}

