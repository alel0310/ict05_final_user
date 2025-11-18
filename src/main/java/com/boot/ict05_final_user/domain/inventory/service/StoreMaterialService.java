package com.boot.ict05_final_user.domain.inventory.service;

import com.boot.ict05_final_user.domain.inventory.dto.StoreMaterialCreateDTO;
import com.boot.ict05_final_user.domain.inventory.dto.StoreMaterialResponse;
import com.boot.ict05_final_user.domain.inventory.entity.InventoryStatus;
import com.boot.ict05_final_user.domain.inventory.entity.StoreInventory;
import com.boot.ict05_final_user.domain.inventory.repository.StoreInventoryRepository;
import com.boot.ict05_final_user.domain.inventory.entity.Material;
import com.boot.ict05_final_user.domain.inventory.entity.MaterialStatus;
import com.boot.ict05_final_user.domain.inventory.entity.StoreMaterial;
import com.boot.ict05_final_user.domain.inventory.repository.MaterialRepository;
import com.boot.ict05_final_user.domain.inventory.repository.StoreMaterialRepository;
import com.boot.ict05_final_user.domain.store.entity.Store;
import com.boot.ict05_final_user.domain.store.repository.StoreRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
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
     * - 가맹점 존재 여부 검증<br>
     * - 코드(code)는 항상 서버에서 자동 생성<br>
     * - 본사 재료 FK / isHqMaterial은 이 메서드에서는 사용하지 않고
     *   별도 매핑 서비스에서만 처리<br>
     * - 재료 상태는 항상 USE 로 시작
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

        // 2) 코드 설정 (없으면 간단 자동 생성)
        String code = generateStoreMaterialCode(store);

        // 3) 변환비율: null 또는 0 이하면 1로 처리
        int conversionRate =
                (dto.getConversionRate() != null && dto.getConversionRate() > 0)
                        ? dto.getConversionRate()
                        : 100;

        // 4) 엔티티 생성
        StoreMaterial storeMaterial = StoreMaterial.builder()
                .store(store)
                .code(code)
                .name(dto.getName())
                .category(dto.getCategory() != null ? dto.getCategory().name() : null)
                .baseUnit(dto.getBaseUnit())
                .salesUnit(dto.getSalesUnit())
                .conversionRate(conversionRate)
                .supplier(dto.getSupplier())
                .temperature(dto.getTemperature())
                .status(MaterialStatus.USE)
                .optimalQuantity(nullSafe(dto.getOptimalQuantity()))
                .purchasePrice(nullSafe(dto.getPurchasePrice()))
                .isHqMaterial(false)
                .build();

        storeMaterialRepository.save(storeMaterial);
        return storeMaterial.getId();
    }

    /* create의 코드 자동 생성 */
    private String generateStoreMaterialCode(Store store) {
        String code = "SM-" + store.getId() + "-" + System.currentTimeMillis();

        // 유니크 제약 충돌 방지용으로 한 번만 더 시도
        if (storeMaterialRepository.existsByStoreAndCode(store, code)) {
            code = "SM-" + store.getId() + "-" + (System.currentTimeMillis() + 1);
        }
        return code;
    }

    private BigDecimal nullSafe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }


    /**
     * 지정 매장의 가맹점 재료 목록을 조회한다.
     *
     * <p>
     * - 입력: storeId (매장 PK)<br>
     * - 출력: StoreMaterialResponse 리스트 (프론트 InventoryManagement 목록용)
     * </p>
     *
     * @param storeId 매장 ID
     * @return 가맹점 재료 응답 DTO 리스트
     */
    @Transactional(readOnly = true)
    public List<StoreMaterialResponse> getStoreMaterials(Long storeId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 매장입니다. id=" + storeId));

        List<StoreMaterial> list = storeMaterialRepository.findByStore(store);
        return list.stream()
                .map(StoreMaterialResponse::from)
                .toList();
    }

}
