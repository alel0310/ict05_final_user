package com.boot.ict05_final_user.domain.attendance.dto;

import com.boot.ict05_final_user.domain.staff.entity.AttendanceStatus;
import com.boot.ict05_final_user.domain.staff.entity.StaffEmploymentType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 직원 근태 수정 시 사용하는 요청/응답 DTO.
 *
 * - 근무 일자, 출퇴근 시간, 근태 상태, 근무 시간 등을 수정할 때 사용됨
 * - 기존 Attendance 엔티티 데이터를 기반으로 Form 형태로 전달
 * - 화면(UI)에서 수정된 값을 다시 백엔드에 전달할 때 매핑되는 객체
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AttendanceModifyFormDTO {

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
