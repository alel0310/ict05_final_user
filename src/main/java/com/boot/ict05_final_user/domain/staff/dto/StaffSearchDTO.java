package com.boot.ict05_final_user.domain.staff.dto;

import lombok.Data;

@Data
public class StaffSearchDTO {
    private String keyword;
    private String type;
    private String size = "10";
    // ✅ 가맹점 ID
    private Long storeId;
}
