package com.boot.ict05_final_user.domain.menu.entity;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "메뉴/재료 품절 처리 상태")
public enum SoldOutStatus {

    @Schema(description = "정상 판매중")
    ON_SALE("판매중", true),

    @Schema(description = "재고 소량(판매 가능)")
    LOW_STOCK("소량 재고", true),

    @Schema(description = "일시 품절(재입고 예정)")
    TEMP_SOLD_OUT("일시 품절", false),

    @Schema(description = "완전 품절(재고 0)")
    SOLD_OUT("품절", false);

    private final String label;       // 한글 라벨
    private final boolean sellable;   // 판매 가능 여부

    SoldOutStatus(String label, boolean sellable) {
        this.label = label;
        this.sellable = sellable;
    }

    public String getLabel() { return label; }
    public boolean isSellable() { return sellable; }

    /** 재고 수량으로 상태 추론 (threshold 기본 5개) */
    public static SoldOutStatus fromQty(int qty, int lowStockThreshold) {
        if (qty <= 0) return SOLD_OUT;
        if (qty <= lowStockThreshold) return LOW_STOCK;
        return ON_SALE;
    }

    public static SoldOutStatus fromQty(int qty) {
        return fromQty(qty, 5);
    }
}
