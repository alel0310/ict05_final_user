package com.boot.ict05_final_user.domain.staff.entity;

import lombok.Getter;

@Getter
public enum StaffShiftTypeName {

    OPEN("오픈"),
    MIDDLE("미들"),
    CLOSE("마감");

    private final String description;

    StaffShiftTypeName(String description) {
        this.description = description;
    }
}
