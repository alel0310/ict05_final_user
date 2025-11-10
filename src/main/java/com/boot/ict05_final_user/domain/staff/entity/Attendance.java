package com.boot.ict05_final_user.domain.staff.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attendance {

    /** 근무 시퀀스 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attendance_id", nullable = false, updatable = false)
    private Long id; // INT UNSIGNED → Long 매핑

    /** 직원 프로필 (근태는 직원에 종속됨) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id_fk", nullable = false)
    private StaffProfile staffProfile;

    /** 근무 일자 */
    @Column(name = "attendance_work_date", nullable = false)
    private LocalDate workDate;

    /** 출근 시간 */
    @Column(name = "attendance_check_in")
    private LocalDateTime checkIn;

    /** 퇴근 시간 */
    @Column(name = "attendance_check_out")
    private LocalDateTime checkOut;

    /** 근태 상태 */
    @Enumerated(EnumType.STRING)
    @Column(name = "attendance_status", nullable = false, length = 16)
    private AttendanceStatus status;

    /** 실제 근무 시간 */
    @Column(name = "attendance_work_hours", nullable = false, precision = 6, scale = 2)
    private BigDecimal workHours;

    /** 비고/사유 */
    @Column(name = "attendance_memo", length = 255)
    private String memo;

    /** 처음 생성된 시각 */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** 마지막으로 수정된 시각 */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

}
