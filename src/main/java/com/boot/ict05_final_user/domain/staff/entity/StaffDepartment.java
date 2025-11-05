package com.boot.ict05_final_user.domain.staff.entity;

/**
 * 직원 부서 Enum
 *
 * <p>부서의 종류를 정의하며, 각 항목은 한글 설명(description)을 가진다.</p>
 *
 * <p>주요 부서:</p>
 * <ul>
 *     <li>OFFICE: 관리팀</li>
 *     <li>STORE: 판매팀</li>
 * </ul>
 */
public enum StaffDepartment {

    OFFICE("본사팀"),

    STORE("판매팀");

    /** 한글 설명 */
    private final String description;

    /**
     * 생성자
     *
     * @param description 각 카테고리의 한글 설명
     */
    StaffDepartment(String description) {
        this.description = description;
    }

    /**
     * 카테고리 한글 설명을 반환한다.
     *
     * @return 카테고리 설명
     */
    public String getDescription() {
        return description;
    }
}
