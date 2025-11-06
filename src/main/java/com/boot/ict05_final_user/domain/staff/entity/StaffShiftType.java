package com.boot.ict05_final_user.domain.staff.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import org.hibernate.annotations.Comment;

import java.time.LocalTime;

@Entity
@Table(name = "staff_shift_type")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffShiftType {

    /** 근무시간대 시퀀스 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "staff_shift_type_id", columnDefinition = "INT UNSIGNED")
    @Comment("근무시간대 시퀀스")
    private Long id;

    /** 근무시간대 이름 */
    @Column(name = "staff_shift_type_name", length = 100, nullable = false)
    @Comment("근무시간대 이름")
    private String staffShiftTypeName;

    /** 근무 시작 시간 */
    @Column(name = "staff_shift_start_time", nullable = false)
    @Comment("시작")
    private LocalTime staffShiftStartTime;

    /** 근무 종료 시간 */
    @Column(name = "staff_shift_end_time", nullable = false)
    @Comment("종료")
    private LocalTime staffShiftEndTime;

    /** 근무시간대 설명 */
    @Column(name = "staff_shift_memo", columnDefinition = "TEXT")
    @Comment("근무시간대 설명")
    private String staffShiftMemo;
}
