package com.boot.ict05_final_user.domain.order.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class CustomerOrderItemDTO {

    private Long menuId;
    private String menuName;
    private Integer quantity;
    private BigDecimal unitPrice;
}
