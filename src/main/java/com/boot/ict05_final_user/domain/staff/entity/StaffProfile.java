package com.boot.ict05_final_user.domain.staff.entity;

import com.boot.ict05_final_admin.domain.auth.entity.Member;
import com.boot.ict05_final_admin.domain.staffresources.dto.StaffModifyFormDTO;
import com.boot.ict05_final_admin.domain.store.entity.Store;
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

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "member_id_fk",
            referencedColumnName = "member_id",
            foreignKey = @ForeignKey(name = "fk_staff_profile__member"),
            nullable = true,
            unique = true
    )
    private Member member;

    /** 직원 근무지 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id_fk", nullable = false)
    private Store store;

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

    /** 직원 급여 */
    @Column(name = "staff_salary")
    private Double staffSalary;

    /** 직원 생년월일 */
    @Schema(type="string", format="date-time")
    @Column(name = "staff_birth")
    private LocalDateTime staffBirth;

    /** 직원 입사일자 (혹은 매장 근무 시작일) */
    @Schema(type="string", format="date-time")
    @Column(name = "staff_start_date")
    private LocalDateTime staffStartDate;

    /** 직원 퇴사일자 */
    @Schema(type="string", format="date-time")
    @Column(name = "staff_end_date")
    private LocalDateTime staffEndDate;

    /**
     * 직원 정보를 수정하는 메서드
     *
     * <p>입력된 {@link StaffModifyFormDT} 객체의 데이터를 기준으로
     * 직원 엔티티의 상태를 변경합니다.</p>
     *
     * @param dto 수정할 직원 정보를 담고 있는 DTO 객체
     */
    public void updateStaff(StaffModifyFormDTO dto) {
        this.staffName = dto.getStaffName();
        this.staffEmploymentType = dto.getStaffEmploymentType();
        this.staffDepartment = dto.getStaffDepartment();
        this.staffEmail = dto.getStaffEmail();
        this.staffPhone = dto.getStaffPhone();
        this.staffAddress = dto.getStaffAddress();
        this.staffBirth = dto.getStaffBirth();
        this.staffStartDate = dto.getStaffStartDate();
        this.staffEndDate = dto.getStaffEndDate();
    }

    public void changeStore(Store store) {
        this.store = store;
    }

}
