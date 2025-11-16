package com.boot.ict05_final_user.domain.order.converter;

import com.boot.ict05_final_user.domain.order.entity.OrderStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class OrderStatusConverter implements AttributeConverter<OrderStatus, String> {
    @Override
    public String convertToDatabaseColumn(OrderStatus attribute) {
        return attribute == null ? null : attribute.getDbValue(); // "준비중" 같은 한글
    }
    @Override
    public OrderStatus convertToEntityAttribute(String dbData) {
        return dbData == null ? null : OrderStatus.from(dbData);  // 한글 -> enum
    }
}
