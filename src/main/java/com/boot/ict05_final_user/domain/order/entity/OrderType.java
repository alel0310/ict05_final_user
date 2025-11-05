package com.boot.ict05_final_user.domain.order.entity;

/** 주문 형태  */
public enum OrderType {
    VISIT("VISIT", "방문"),
    TAKEOUT("TAKEOUT", "포장"),
    DELIVERY("DELIVERY", "배달");

    private final String dbValue;
    private final String label;
    OrderType(String dbValue, String label) { this.dbValue = dbValue; this.label = label; }
    public String getDbValue() { return dbValue; }
    public String getLabel()   { return label; }

    public static OrderType from(String dbValue) {
        for (OrderType v : values()) if (v.dbValue.equals(dbValue)) return v;
        throw new IllegalArgumentException("Unknown OrderType dbValue=" + dbValue);
    }
}