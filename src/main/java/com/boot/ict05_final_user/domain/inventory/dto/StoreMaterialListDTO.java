package com.boot.ict05_final_user.domain.inventory.dto;

import com.boot.ict05_final_user.domain.inventory.entity.MaterialStatus;
import com.boot.ict05_final_user.domain.inventory.entity.MaterialTemperature;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 가맹점 재료 목록 DTO
 * 목록 화면 조회용
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class StoreMaterialListDTO {

    /** 가맹점 재료 고유 ID */
    private Long id;

    /** 가맹점 재료 코드 */
    private String code;

    /** 가맹점 재료명 */
    private String name;

    /** 카테고리 */
    private String category;

    /** 단위 (예: kg, 개, L 등) */
    private String baseUnit;

    /** 본사 기준 판매단위 (예: kg, 개, L 등) */
    private String salesUnit;

    /** 공급업체명 */
    private String supplier;

    /** 보관온도 */
    private MaterialTemperature temperature;

    /** 재료 상태 */
    private MaterialStatus status;

    /** 현재 수량 */
    private Integer quantity;

    /** 적정 수량 */
    private Integer optimalQuantity;

    /** 매입가 */
    private BigDecimal purchasePrice;

    /** 판매가 */
    private BigDecimal sellingPrice;

    /** 유통기한 */
    private LocalDate expirationDate;

    /** 본사 재료 여부 */
    private boolean isHqMaterial;
}
