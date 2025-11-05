package com.boot.ict05_final_user.domain.order.entity;

/** 결제 방식 (DB에는 영문 소문자 코드 저장: card/cash/voucher/external) */
public enum PaymentType {
    CARD("card", "카드"),
    CASH("cash", "현금"),
    VOUCHER("voucher", "상품권"),
    EXTERNAL("external", "외부 결제");

    private final String code;   // DB 저장값
    private final String label;  // 한글 라벨

    PaymentType(String code, String label) {
        this.code = code; this.label = label;
    }
    public String getCode() { return code; }
    public String getLabel() { return label; }

    public static PaymentType fromCode(String code) {
        for (PaymentType v : values()) {
            if (v.code.equals(code)) return v;
        }
        throw new IllegalArgumentException("Unknown PaymentType code=" + code);
    }
}