package com.boot.ict05_final_admin.domain.staffresources.dto;

import com.boot.ict05_final_admin.domain.staffresources.entity.StaffDepartment;
import com.boot.ict05_final_admin.domain.staffresources.entity.StaffEmploymentType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 직원 프로필 등록 폼 DTO
 *
 * 직원 정보 등록 시 클라이언트에서 전달하는 값들을 담는다.
 * 수정 대상 식별자, 소속 매장, 이름, 근무 형태, 연락처, 주소, 급여,
 * 생년월일, 입사일자, 퇴사일자를 포함한다.
 *
 * 검증 규칙 요약
 * - storeIdFk, staffName, staffEmploymentType는 필수
 * - staffEmail은 입력 시 이메일 형식이어야 함
 * - staffPhone은 숫자와 하이픈만 허용
 * - staffSalary는 0 이상
 * - staffBirth는 과거, staffStartDate는 과거 또는 현재, staffEndDate는 과거 또는 현재
 * </ul>
 */
@Data
public class StaffWriteFormDTO {

    /** 사원 근무지 */
    private Long storeIdFk;

    /** 사원 이름 */
    @NotNull(message = "직원 이름을 입력해주세요")
    private String staffName;

    /** 직무 형태 (점주, 직원, 알바) */
    @NotNull(message = "근무 형태를 선택해주세요")
    private StaffEmploymentType staffEmploymentType;

    /** 사원 부서 (관리팀, 판매팀) */
    @NotNull(message = "직원 부서를 선택해주세요")
    private StaffDepartment staffDepartment;

    /** 사원 이메일 */
    @NotNull(message = "이메일을 입력해주세요")
    @Email(message = "이메일 형식이 올바르지 않습니다")
    private String staffEmail;

    /** 사원 연락처 */
    @NotNull(message = "연락처를 입력해주세요")
    @Pattern(regexp = "^[0-9\\-]{9,13}$", message = "연락처는 숫자와 하이픈만 입력해주세요")
    private String staffPhone;

    @Size(max = 255, message = "주소는 255자 이내로 입력해주세요")
    private String userAddress1;

    @Size(max = 255, message = "주소는 255자 이내로 입력해주세요")
    private String userAddress2;

    /** 사원 주소 */
    @Size(max = 255, message = "주소는 255자 이내로 입력해주세요")
    private String staffAddress;

    /** 생년월일 (과거) */
    @NotNull(message = "생년월일을 입력해주세요")
    @Past(message = "생년월일은 과거여야 합니다")
    private LocalDateTime staffBirth;

    /** 입사일자 (선택, 과거 또는 현재) */
    @PastOrPresent(message = "입사일자는 과거 또는 오늘이어야 합니다")
    private LocalDateTime staffStartDate;

    /** 퇴사일자 (선택, 과거 또는 현재, 재직 중이면 null) */
    @PastOrPresent(message = "퇴사일자는 과거 또는 오늘이어야 합니다")
    private LocalDateTime staffEndDate;
}
