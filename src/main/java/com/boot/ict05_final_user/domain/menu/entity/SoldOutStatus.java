package com.boot.ict05_final_user.domain.menu.entity;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "메뉴/재료 판매 상태")
public enum SoldOutStatus {

    @Schema(description = "정상 판매중")
    ON_SALE("판매중", true),

    @Schema(description = "품절(판매 불가)")
    SOLD_OUT("품절", false);

    private final String label;       // 한글 라벨
    private final boolean sellable;   // 판매 가능 여부

    SoldOutStatus(String label, boolean sellable) {
        this.label = label;
        this.sellable = sellable;
    }

    public String getLabel() { return label; }
    public boolean isSellable() { return sellable; }

    /** 재고 수량으로 상태 추론 (기준: 재고 1 이상 = 판매중, 0 이하 = 품절) */
    public static SoldOutStatus fromQty(int qty) {
        return qty > 0 ? ON_SALE : SOLD_OUT;
    }
}
