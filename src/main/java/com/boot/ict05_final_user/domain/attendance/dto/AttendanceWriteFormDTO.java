package com.boot.ict05_final_user.domain.attendance.dto;

import com.boot.ict05_final_user.domain.staff.entity.AttendanceStatus;
import com.boot.ict05_final_user.domain.staff.entity.StaffEmploymentType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AttendanceWriteFormDTO {

/**
 * 직원 근태 등록 폼 DTO
 *
 * 직원 근태 등록 시 클라이언트에서 전달하는 값들을 담는다.
 * 수정 대상 식별자, 소속 매장, 이름, 근무 형태, 연락처, 주소, 급여,
 * 생년월일, 입사일자, 퇴사일자를 포함한다.
 *
 */

    /** 근무 시퀀스 */
    private Long attendanceId;

    /** 근무 일자 */
    private LocalDate attendanceWorkDate;

    /** 출근 시간 */
    private LocalDateTime attendanceCheckIn;

    /** 퇴근 시간 */
    private LocalDateTime attendanceCheckOut;

    /** 근태 상태 */
    private AttendanceStatus attendanceStatus;

    /** 실제 근무 시간 */
    private BigDecimal attendanceWorkHours;

    /** 근태 비고/사유 */
    private String attendanceMemo;

    // === StaffProfile JOIN 해서 가져올 정보 ===
    /** 직원 시퀀스 */
    private Long staffId;

    /** 직원 이름 */
    private String staffName;

    /** 직원 근무형태 (점주/직원/알바 등) */
    private StaffEmploymentType staffEmploymentType;

}
