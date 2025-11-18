package com.boot.ict05_final_user.domain.staff.repository;

import com.boot.ict05_final_user.domain.staff.dto.AttendanceListDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface AttendanceRepositoryCustom {

    /**
     * 특정 매장의 특정 날짜에 근무한 직원들의 근태 + 직원 정보를 페이징 조회
     */
    Page<AttendanceListDTO> findDailyAttendanceByStore(
            Long storeId,
            LocalDate workDate,
            Pageable pageable
    );
}
