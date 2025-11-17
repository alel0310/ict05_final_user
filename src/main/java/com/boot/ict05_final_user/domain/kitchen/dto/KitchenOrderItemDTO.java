package com.boot.ict05_final_user.domain.kitchen.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KitchenOrderItemDTO {
    private Long menuId;
    private String name;
    private BigDecimal price;
    private int quantity;
    private String image;
    private String options;
}
