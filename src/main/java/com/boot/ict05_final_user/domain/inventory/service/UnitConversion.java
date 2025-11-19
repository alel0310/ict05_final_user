package com.boot.ict05_final_user.domain.inventory.service;

import com.boot.ict05_final_user.domain.inventory.entity.StoreMaterial;
import com.boot.ict05_final_user.domain.menu.entity.RecipeUnit;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class UnitConversion {

    /**
     * TODO: 실제 규칙 적용 전까지 1:1 변환
     * 추후 StoreMaterial.salesUnit/baseUnit, conversionRate를 사용해 변환 규칙 구현
     */
    public BigDecimal convert(BigDecimal qty, RecipeUnit recipeUnit, StoreMaterial target) {
        return qty == null ? BigDecimal.ZERO : qty;
    }
}
