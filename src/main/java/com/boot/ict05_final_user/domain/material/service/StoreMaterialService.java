package com.boot.ict05_final_user.domain.material.service;

import com.boot.ict05_final_user.domain.material.dto.StoreMaterialCreateDTO;
import com.boot.ict05_final_user.domain.inventory.entity.InventoryStatus;
import com.boot.ict05_final_user.domain.inventory.entity.StoreInventory;
import com.boot.ict05_final_user.domain.inventory.repository.StoreInventoryRepository;
import com.boot.ict05_final_user.domain.material.entity.Material;
import com.boot.ict05_final_user.domain.material.entity.MaterialStatus;
import com.boot.ict05_final_user.domain.material.entity.StoreMaterial;
import com.boot.ict05_final_user.domain.inventory.repository.MaterialRepository;
import com.boot.ict05_final_user.domain.inventory.repository.StoreMaterialRepository;
import com.boot.ict05_final_user.domain.store.entity.Store;
import com.boot.ict05_final_user.domain.store.repository.StoreRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StoreMaterialService {

    private final StoreRepository storeRepository;
    private final MaterialRepository materialRepository;
    private final StoreMaterialRepository storeMaterialRepository;
    private final StoreInventoryRepository storeInventoryRepository;

    /**
     * 선택 가맹점에 대해 본사 재료를 일괄 매핑한다.
     *
     * - 이미 StoreMaterial 이 있는 본사 재료는 건너뜀
     * - 새로 생성되는 StoreMaterial 은 status=STOP, hqMaterial=true
     * - StoreInventory 도 함께 생성(수량 0)
     *
     * @return 새로 생성된 StoreMaterial 개수
     */
    public int mapAllHqMaterialsToStore(Long storeId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 매장: " + storeId));

        // 본사에서 실제 사용 중인 재료만 매핑하고 싶으면 USE 로 필터
        List<Material> hqMaterials = materialRepository.findByMaterialStatus(MaterialStatus.USE);

        int created = 0;

        for (Material material : hqMaterials) {
            if (storeMaterialRepository.existsByStoreAndMaterial(store, material)) {
                continue;   // 이미 매핑된 재료는 스킵
            }

            // 코드/이름/단위/카테고리는 본사 재료에서 기본값 복사
            StoreMaterial storeMaterial = StoreMaterial.builder()
                    .store(store)
                    .material(material)
                    .code(material.getCode())                  // 필요하면 점포 prefix 끼워넣기
                    .name(material.getName())
                    .category(material.getMaterialCategory().name())
                    .baseUnit(material.getBaseUnit())          // 본사 엔티티에 맞게
                    .salesUnit(material.getSalesUnit())
                    .conversionRate(material.getConversionRate())
                    .supplier(null)                            // 가맹점에서 별도 입력
                    .temperature(material.getMaterialTemperature())
                    .status(MaterialStatus.STOP)               // 기본: 미사용
                    .optimalQuantity(null)                     // 가맹점이 나중에 입력
                    .purchasePrice(null)                       // 가맹점 최근 단가
                    .isHqMaterial(true)
                    .build();

            storeMaterialRepository.save(storeMaterial);

            // 가맹점 재고도 같이 0으로 생성
            StoreInventory inventory = StoreInventory.builder()
                    .store(store)
                    .storeMaterial(storeMaterial)
                    .quantity(BigDecimal.ZERO)
                    .optimalQuantity(null)
                    .status(InventoryStatus.SUFFICIENT)        // 수량 0이지만 적정수량도 없으니 일단 SUFFICIENT
                    .build();

            inventory.touchAfterQuantityChange();               // updateDate, status 정합성 유지
            storeInventoryRepository.save(inventory);

            created++;
        }

        return created;
    }

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
