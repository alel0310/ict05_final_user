package com.boot.ict05_final_user.domain.inventory.service;

import com.boot.ict05_final_user.domain.inventory.dto.StoreInventoryListDTO;
import com.boot.ict05_final_user.domain.inventory.entity.InventoryStatus;
import com.boot.ict05_final_user.domain.inventory.entity.StoreInventory;
import com.boot.ict05_final_user.domain.inventory.entity.StoreMaterial;
import com.boot.ict05_final_user.domain.inventory.repository.StoreInventoryRepository;
import com.boot.ict05_final_user.domain.inventory.repository.StoreMaterialRepository;
import com.boot.ict05_final_user.domain.store.entity.Store;
import com.boot.ict05_final_user.domain.store.repository.StoreRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class StoreInventoryService {

    private final StoreRepository storeRepository;
    private final StoreMaterialRepository storeMaterialRepository;
    private final StoreInventoryRepository storeInventoryRepository;

    /**
     * 지정 매장의 재고 목록 조회
     *
     * @param storeId 매장 ID
     */
    @Transactional(readOnly = true)
    public List<StoreInventoryListDTO> getStoreInventoryList(Long storeId) {
        List<StoreInventory> list = storeInventoryRepository.findByStore_Id(storeId);
        return list.stream()
                .map(StoreInventoryListDTO::from)
                .toList();
    }

    /**
     * 지정 매장의 StoreMaterial 전부에 대해
     * 재고가 없는 것만 quantity=0 으로 생성한다.
     *
     * @param storeId 매장 ID
     * @return 새로 생성된 StoreInventory 개수
     */
    @Transactional
    public int initInventoryForStore(Long storeId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new EntityNotFoundException("존재하지 않는 매장입니다. id=" + storeId));

        // 이미 재고가 있는 StoreMaterial ID 집합
        List<StoreInventory> existing = storeInventoryRepository.findByStore(store);
        Set<Long> existingSmIds = existing.stream()
                .map(si -> si.getStoreMaterial().getId())
                .collect(Collectors.toSet());

        // 매장에 이미 등록된 모든 가맹점 재료
        List<StoreMaterial> materials = storeMaterialRepository.findByStore(store);

        int created = 0;

        for (StoreMaterial sm : materials) {
            if (existingSmIds.contains(sm.getId())) {
                continue;   // 이미 재고가 있으면 스킵
            }

            StoreInventory inv = StoreInventory.builder()
                    .store(store)
                    .storeMaterial(sm)
                    .quantity(BigDecimal.ZERO)
                    // 가맹점 재료의 적정 재고를 그대로 복사해도 되고, null 로 두어도 됨
                    .optimalQuantity(sm.getOptimalQuantity())
                    .status(InventoryStatus.SUFFICIENT)
                    .build();

            inv.touchAfterQuantityChange();   // 상태 + updateDate 동기화
            storeInventoryRepository.save(inv);
            created++;
        }

        return created;
    }
}
