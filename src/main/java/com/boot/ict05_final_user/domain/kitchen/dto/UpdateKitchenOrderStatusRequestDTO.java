package com.boot.ict05_final_user.domain.kitchen.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateKitchenOrderStatusRequestDTO {
    // "preparing" | "cooking" | "ready" | "completed"
    private String status;
}
