package com.boot.ict05_final_user.domain.attendance.repository;

import com.boot.ict05_final_user.domain.attendance.dto.AttendanceDetailDTO;
import com.boot.ict05_final_user.domain.attendance.dto.AttendanceListDTO;
import com.boot.ict05_final_user.domain.attendance.dto.AttendanceSearchDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.Optional;

public interface AttendanceRepositoryCustom {

    /** 특정 매장의 특정 날짜에 근무한 직원들의 근태 + 직원 정보를 페이징 조회 */
    Page<AttendanceListDTO> findDailyAttendanceByStore(
            Long storeId,
            LocalDate workDate,
            Pageable pageable,
            AttendanceSearchDTO searchDto
    );

    /**  근태 상세 조회용 */
    Optional<AttendanceDetailDTO> findAttendanceDetailByIdAndStore(Long attendanceId, Long storeId);
}
