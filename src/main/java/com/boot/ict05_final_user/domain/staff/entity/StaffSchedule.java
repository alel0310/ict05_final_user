package com.boot.ict05_final_user.domain.staff.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "staff_schedule")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffSchedule {

    /** 근무 배정 시퀀스 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "staff_schedule_id", columnDefinition = "BIGINT UNSIGNED")
    private Long id; // PK

    /** 매장 시퀀스 (fk) */
//    @ManyToOne(fetch = FetchType.LAZY, optional = false)
//    @JoinColumn(name = "store_id_fk", nullable = false)
//    private Store store; // 매장 FK

    /** 직원 시퀀스 (fk) */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "staff_id_fk", nullable = false)
    private StaffProfile staff; // 직원 FK

    /** 근무시간대 시퀀스 (fk) */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "staff_shift_type_id_fk", nullable = false)
    private StaffShiftType shiftType; // 근무시간대 FK

    /** 근무 (예정) 일자 */
    @Column(name = "staff_schedule_work_date", nullable = false)
    private LocalDate staffScheduleWorkDate; // DATE

    /** 근무 배정 비고 */
    @Column(name = "staff_schedule_memo", columnDefinition = "TEXT")
    private String staffScheduleMemo; // TEXT (nullable)
}


