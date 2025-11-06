package com.boot.ict05_final_user.domain.staff.dto;

import com.boot.ict05_final_user.domain.staff.entity.StaffDepartment;
import com.boot.ict05_final_user.domain.staff.entity.StaffEmploymentType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StaffListDTO {

    /** 사원 시퀀스 */
    private Long id;

    /** 사원 이름 */
    private String staffName;

    /** 사원 생년월일 */
    @Schema(type="string", format="date-time")
    private LocalDateTime staffBirth;

    /** 사원 부서 (관리팀, 판매팀) */
    private StaffDepartment staffDepartment;

    /** 사원 근무형태 (점주/직원/알바) */
    private StaffEmploymentType staffEmploymentType;

    /** 사원 입사일자 (혹은 매장 근무 시작일) */
    @Schema(type="string", format="date-time")
    private LocalDateTime staffStartDate;

}
