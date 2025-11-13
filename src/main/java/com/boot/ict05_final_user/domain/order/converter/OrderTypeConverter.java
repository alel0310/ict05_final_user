package com.boot.ict05_final_user.domain.order.converter;

import com.boot.ict05_final_user.domain.order.entity.OrderType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class OrderTypeConverter implements AttributeConverter<OrderType, String> {
    @Override
    public String convertToDatabaseColumn(OrderType attribute) {
        return attribute == null ? null : attribute.getDbValue(); // "VISIT" 등
    }
    @Override
    public OrderType convertToEntityAttribute(String dbData) {
        return dbData == null ? null : OrderType.from(dbData);
    }
}
