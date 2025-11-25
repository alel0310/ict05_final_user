package com.boot.ict05_final_user.domain.inventory.dto;

import jakarta.validation.constraints.Digits;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 가맹점 재료 상세 설정 저장 요청 DTO.
 *
 * <p>용도</p>
 * <ul>
 *   <li>팝업(설정) 저장 시 적정재고와 사용 여부를 부분 업데이트한다.</li>
 *   <li>각 필드는 선택적이며, {@code null}이면 해당 항목은 변경하지 않는다.</li>
 * </ul>
 *
 * <p>계약</p>
 * <ul>
 *   <li>{@code optimalQuantity}: 소진 단위 기준, 0 이상, 소수 3자리까지 허용.</li>
 *   <li>{@code status}: 문자열 {@code USE | STOP} 중 하나, 대소문자 고정.</li>
 * </ul>
 */
@Data
public class StoreMaterialSettingsUpdateRequestDTO {

    /** 적정 재고량(소진 단위). {@code null}이면 변경 없음. */
    @Digits(integer = 15, fraction = 3)
    private BigDecimal optimalQuantity;

    /** 사용 여부. 허용값: {@code USE | STOP}. {@code null}이면 변경 없음. */
    private String status;
}
