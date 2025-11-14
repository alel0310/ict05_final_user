package com.boot.ict05_final_user.domain.order.converter;

import com.boot.ict05_final_user.domain.order.entity.PaymentType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class PaymentTypeConverter implements AttributeConverter<PaymentType, String> {

    @Override
    public String convertToDatabaseColumn(PaymentType attribute) {
        // DB에는 enum name("CARD", "CASH" ...)을 저장
        return attribute == null ? null : attribute.name();
    }

    @Override
    public PaymentType convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;

        // 1) enum name 기준 (CARD / card 등)
        try {
            return PaymentType.valueOf(dbData.trim().toUpperCase());
        } catch (IllegalArgumentException ignore) {
        }

        // 2) 한글 라벨 기준 ("카드", "현금" 등)도 허용
        for (PaymentType type : PaymentType.values()) {
            if (type.getLabel().equals(dbData.trim())) {
                return type;
            }
        }

        throw new IllegalArgumentException("Unknown PaymentType: " + dbData);
    }
}
