package com.boot.ict05_final_user.domain.menu.entity;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "가맹점 메뉴 판매 상태(품절 여부)")
public enum StoreMenuSoldout {

    @Schema(description = "판매 가능")
    ON_SALE(0, "판매중"),

    @Schema(description = "품절")
    SOLD_OUT(1, "품절");

    private final int code;
    private final String label;

    StoreMenuSoldout(int code, String label) {
        this.code = code;
        this.label = label;
    }

    public int getCode() { return code; }
    public String getLabel() { return label; }

    /** int → Enum */
    public static StoreMenuSoldout fromCode(int code) {
        return code == 1 ? SOLD_OUT : ON_SALE;
    }
}
