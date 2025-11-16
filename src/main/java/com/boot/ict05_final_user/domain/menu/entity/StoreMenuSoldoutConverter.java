package com.boot.ict05_final_user.domain.menu.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class StoreMenuSoldoutConverter implements AttributeConverter<StoreMenuSoldout, Integer> {

    @Override
    public Integer convertToDatabaseColumn(StoreMenuSoldout attribute) {
        if (attribute == null) return 0;
        return attribute.getCode();
    }

    @Override
    public StoreMenuSoldout convertToEntityAttribute(Integer dbData) {
        if (dbData == null) return StoreMenuSoldout.ON_SALE;
        return StoreMenuSoldout.fromCode(dbData);
    }

}
