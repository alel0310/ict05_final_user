package com.boot.ict05_final_user.domain.purchaseOrder.entity;

/** 발주 상태 */
public enum PurchaseOrderStatus {

    /** 주문됨 */
    RECEIVED("주문됨"),

    /** 배송중 */
    SHIPPING("배송중"),

    /** 검수완료 */
    DELIVERED("검수완료");

    /** 한글 설명 */
    private final String description;

    /**
     * 생성자
     *
     * @param description 각 카테고리의 한글 설명
     */
    PurchaseOrderStatus(String description) { this.description = description; }

    /**
     * 카테고리 한글 설명을 반환한다.
     *
     * @return 카테고리 설명
     */
    public String getDescription() { return description; }
}
