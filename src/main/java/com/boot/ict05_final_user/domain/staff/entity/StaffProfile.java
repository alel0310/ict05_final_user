package com.boot.ict05_final_user.domain.staff.entity;

import com.boot.ict05_final_user.domain.store.entity.Store;
import com.boot.ict05_final_user.domain.user.entity.Member;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffProfile {

    /** 직원 시퀀스 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "staff_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id_fk", nullable = false)
    private Store store;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "member_id_fk",
            referencedColumnName = "member_id",
            foreignKey = @ForeignKey(name = "fk_staff_profile__member"),
            nullable = true,
            unique = true
    )
    private Member member;

    /** 직원 이름 */
    @Column(name = "staff_name", length = 100)
    private String staffName;

    /** 직원 근무형태 (점주/직원/알바) */
    @Enumerated(EnumType.STRING)
    @Column(name = "staff_employment_type")
    private StaffEmploymentType staffEmploymentType;

    /** 직원 부서 */
    @Enumerated(EnumType.STRING)
    @Column(name = "staff_department")
    private StaffDepartment staffDepartment;

    /** 직원 이메일 */
    @Column(name = "staff_email")
    private String staffEmail;

    /** 직원 전화번호 */
    @Column(name = "staff_phone", length = 50)
    private String staffPhone;

    /** 직원 주소 */
    @Column(name = "staff_address")
    private String staffAddress;

    /** 직원 생년월일 */
    @Schema(type = "string", format = "date-time")
    @Column(name = "staff_birth")
    private LocalDateTime staffBirth;

    /** 직원 입사일자 (혹은 매장 근무 시작일) */
    @Schema(type = "string", format = "date-time")
    @Column(name = "staff_start_date")
    private LocalDateTime staffStartDate;

    /** 직원 퇴사일자 */
    @Schema(type = "string", format = "date-time")
    @Column(name = "staff_end_date")
    private LocalDateTime staffEndDate;


}
