package com.boot.ict05_final_user.domain.attendance.dto;

import com.boot.ict05_final_user.domain.staff.entity.AttendanceStatus;
import lombok.Data;

@Data
public class AttendanceSearchDTO {

    /** 검색어 (직원명, 직원 ID 등) */
    private String keyword;

    /** 검색 타입 (name, status, all 등) */
    private String type;

    /** 페이지 사이즈 */
    private String size = "10";

    /** 가맹점 ID */
    private Long storeId;

    /** 근태 상태 (LATE, NORMAL, ABSENT 등) */
    private AttendanceStatus attendanceStatus;
}
