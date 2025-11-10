package com.boot.ict05_final_user.domain.staff.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StaffScheduleListDTO {

    /** 근무 배정 시퀀스 */
    private Long id;

    /** 근무 (예정) 일자 */
    @Schema(type="string", format="date-time")
    private LocalDate staffScheduleWorkDate;

    /** 근무 배정 비고 */
    private String staffScheduleMemo;

}
