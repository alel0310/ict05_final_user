package com.boot.ict05_final_user.domain.order.entity;

/** 주문 상태 (DB에는 한글 값 저장) */
public enum OrderStatus {
    PENDING("대기"),
    PAID("결제완료"),
    PREPARING("준비중"),
    COOKING("조리중"),
    COMPLETED("완료"),
    CANCELED("취소"),
    READY("픽업대기"),
    REFUNDED("환불");

    private final String dbValue;

    OrderStatus(String dbValue) { this.dbValue = dbValue; }
    public String getDbValue() { return dbValue; }

    public static OrderStatus from(String dbValue) {
        for (OrderStatus v : values()) {
            if (v.dbValue.equals(dbValue)) return v;
        }
        throw new IllegalArgumentException("Unknown OrderStatus dbValue=" + dbValue);
    }
}