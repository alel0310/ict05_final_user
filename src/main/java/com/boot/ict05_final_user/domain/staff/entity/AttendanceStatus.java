package com.boot.ict05_final_user.domain.staff.entity;


import java.util.Arrays;

/** 직원 상태 (DB에는 한글 값 저장) */
public enum AttendanceStatus {
    NORMAL("normal", "정상"),
    LATE("late", "지각"),
    EARLY_LEAVE("early_leave", "조퇴"),
    ABSENT("absent", "결근"),
    VACATION("vacation", "휴가"),
    HOLIDAY("holiday", "휴일"),
    RESIGN("resign", "퇴사");

    private final String code;   // DB 저장값
    private final String label;  // 한글 라벨

    AttendanceStatus(String code, String label) {
        this.code = code;
        this.label = label;
    }

    public String getCode() {
        return code;
    }

    public String getLabel() {
        return label;
    }

    public static AttendanceStatus fromCode(String code) {
        return Arrays.stream(values())
                .filter(v -> v.code.equalsIgnoreCase(code))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown AttendanceStatus code: " + code));
    }

    public static AttendanceStatus fromLabel(String label) {
        return Arrays.stream(values())
                .filter(v -> v.label.equals(label))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown AttendanceStatus label: " + label));
    }
}