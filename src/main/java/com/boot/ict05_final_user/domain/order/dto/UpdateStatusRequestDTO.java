package com.boot.ict05_final_user.domain.order.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateStatusRequestDTO {
    private String status; // "PREPARING" | "READY" | "COMPLETED" | "CANCELED" | "PAID" ...
}
