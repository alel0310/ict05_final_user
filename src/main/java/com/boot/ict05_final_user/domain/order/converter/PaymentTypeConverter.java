package com.boot.ict05_final_user.domain.order.converter;

import com.boot.ict05_final_user.domain.order.entity.PaymentType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class PaymentTypeConverter implements AttributeConverter<PaymentType, String> {
    @Override
    public String convertToDatabaseColumn(PaymentType attribute) {
        return attribute == null ? null : attribute.getCode(); // "card"
    }
    @Override
    public PaymentType convertToEntityAttribute(String dbData) {
        return dbData == null ? null : PaymentType.fromCode(dbData);
    }
}
