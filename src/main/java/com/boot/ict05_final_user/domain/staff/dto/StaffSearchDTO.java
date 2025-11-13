package com.boot.ict05_final_user.domain.staff.dto;

import lombok.Data;

@Data
public class StaffSearchDTO {

    /** 검색어 */
    private String keyword;

    /** 검색 타입 (name/info/all) */
    private String type;

    /** 페이지 사이즈 */
    private String size = "10";

    // 필터 키 (안정성)
    private Long storeId;
}
