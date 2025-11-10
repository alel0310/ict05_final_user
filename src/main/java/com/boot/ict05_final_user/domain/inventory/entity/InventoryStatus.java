package com.boot.ict05_final_user.domain.inventory.entity;

import java.math.BigDecimal;

/**
 * 재료의 재고상태 Enum
 *
 * <p>재료의 재고상태를 정의하며, 각 항목은 한글 설명(description)을 가진다.</p>
 *
 * <p>재료의 재고상태:</p>
 * <ul>
 *     <li>SUFFICIENT: 충분</li>
 *     <li>LOW: 부족</li>
 *     <li>SHORTAGE: 품절</li>
 * </ul>
 */
public enum InventoryStatus {
    /** 충분 */
    SUFFICIENT("충분"),

    /** 부족 */
    LOW("부족"),

    /** 품절 */
    SHORTAGE("품절");

    /** 한글 설명 */
    private final String description;

    /**
     * 생성자
     *
     * @param description 각 재료의 재고상태의 한글 설명
     */
    InventoryStatus(String description) {
        this.description = description;
    }

    /**
     * 재료의 재고상태 한글 설명을 반환한다.
     *
     * @return 재료의 재고상태 설명
     */
    public String getDescription() {
        return description;
    }


    /**
     * 현재 수량과 적정 수량을 기준으로 재고 상태를 계산한다.
     */
    public static InventoryStatus calculate(BigDecimal quantity, BigDecimal optimalQuantity) {
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) == 0) {
            return SHORTAGE;
        }
        if (optimalQuantity == null) {
            return SUFFICIENT;
        }

        BigDecimal threshold = optimalQuantity.multiply(new BigDecimal("0.3"));
        return quantity.compareTo(threshold) < 0 ? LOW : SUFFICIENT;
    }
}
