package com.boot.ict05_final_user.domain.material.dto;

import com.boot.ict05_final_user.domain.material.entity.MaterialStatus;
import lombok.Data;

/**
 * 가맹점 재료 검색 DTO
 * 목록 검색 조건 전달용
 */
@Data
public class StoreMaterialSearchDTO {
    private String s;
    private String type;
    private String size = "10";

    /** 재료 상태 필터 (USE / STOP) */
    private MaterialStatus status;

    /** 본사 재료 여부 필터 */
    private Boolean isHqMaterial;

    /** 가맹점 ID */
    private Long storeId;
}
