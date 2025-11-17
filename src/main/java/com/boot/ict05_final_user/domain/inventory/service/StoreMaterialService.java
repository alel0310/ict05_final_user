package com.boot.ict05_final_user.domain.inventory.service;

import com.boot.ict05_final_user.domain.inventory.dto.StoreMaterialCreateDTO;
import com.boot.ict05_final_user.domain.inventory.entity.Material;
import com.boot.ict05_final_user.domain.inventory.entity.StoreMaterial;
import com.boot.ict05_final_user.domain.inventory.repository.MaterialRepository;
import com.boot.ict05_final_user.domain.inventory.repository.StoreMaterialRepository;
import com.boot.ict05_final_user.domain.store.entity.Store;
import com.boot.ict05_final_user.domain.store.repository.StoreRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class StoreMaterialService {

    private final StoreMaterialRepository storeMaterialRepository;
    private final StoreRepository storeRepository;
    private final MaterialRepository materialRepository;

    /**
     * 가맹점 재료 등록
     *
     * <p>
     * - 가맹점 / 본사 재료 존재 여부 검증<br>
     * - (store, code) 중복 검증<br>
     * - code 미지정 시 서버에서 간단히 자동 생성<br>
     * </p>
     *
     * @param dto 등록 요청 DTO
     * @return 생성된 StoreMaterial ID
     */
    @Transactional
    public Long create(StoreMaterialCreateDTO dto) {
        // 1) 가맹점 조회
        Store store = storeRepository.findById(dto.getStoreId())
                .orElseThrow(() -> new EntityNotFoundException("가맹점을 찾을 수 없습니다. id=" + dto.getStoreId()));

        // 2) 본사 재료 FK 처리
        Material material = null;
        if (dto.isHqMaterial()) {
            if (dto.getMaterialId() == null) {
                throw new IllegalArgumentException("본사 재료를 사용하는 경우 materialId는 필수입니다.");
            }
            material = materialRepository.findById(dto.getMaterialId())
                    .orElseThrow(() -> new EntityNotFoundException("본사 재료를 찾을 수 없습니다. id=" + dto.getMaterialId()));
        }

        // 3) 코드 설정 (없으면 간단 자동 생성)
        String code = dto.getCode();
        if (code == null || code.isBlank()) {
            // 필요하면 규칙 변경 가능: 예) SM-{storeId}-{millis}
            code = "SM-" + store.getId() + "-" + System.currentTimeMillis();
        }

        // 4) (store, code) 중복 체크
        boolean exists = storeMaterialRepository.existsByStoreAndCode(store, code);
        if (exists) {
            throw new IllegalStateException("이미 사용 중인 가맹점 재료 코드입니다. storeId=" +
                    store.getId() + ", code=" + code);
        }

        // 5) 엔티티 생성
        StoreMaterial storeMaterial = StoreMaterial.builder()
                .store(store)
                .material(material)
                .code(code)
                .name(dto.getName())
                .category(dto.getCategory().name())   // Enum을 문자열로 저장
                .baseUnit(dto.getBaseUnit())
                .salesUnit(dto.getSalesUnit())
                .conversionRate(
                        dto.getConversionRate() != null && dto.getConversionRate() > 0
                                ? dto.getConversionRate()
                                : 1
                )
                .supplier(dto.getSupplier())
                .temperature(dto.getTemperature())
                .status(dto.getStatus())
                .optimalQuantity(nullSafe(dto.getOptimalQuantity()))
                .purchasePrice(nullSafe(dto.getPurchasePrice()))
                .isHqMaterial(dto.isHqMaterial())
                .build();

        storeMaterialRepository.save(storeMaterial);
        return storeMaterial.getId();
    }

    private BigDecimal nullSafe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
