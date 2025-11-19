package com.boot.ict05_final_user.domain.inventory.service;

import com.boot.ict05_final_user.domain.inventory.dto.StoreInventoryListDTO;
import com.boot.ict05_final_user.domain.inventory.dto.StoreInventoryRestockRequest;
import com.boot.ict05_final_user.domain.inventory.dto.StoreInventoryRestockResponse;
import com.boot.ict05_final_user.domain.inventory.entity.InventoryStatus;
import com.boot.ict05_final_user.domain.inventory.entity.StoreInventory;
import com.boot.ict05_final_user.domain.inventory.entity.StoreMaterial;
import com.boot.ict05_final_user.domain.inventory.repository.StoreInventoryRepository;
import com.boot.ict05_final_user.domain.inventory.repository.StoreMaterialRepository;
import com.boot.ict05_final_user.domain.store.entity.Store;
import com.boot.ict05_final_user.domain.store.repository.StoreRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;


@Slf4j
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
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 매장: " + storeId));

        List<StoreMaterial> materials = storeMaterialRepository.findByStore(store);

        int created = 0;
        for (StoreMaterial sm : materials) {
            boolean exists = storeInventoryRepository
                    .existsByStoreAndStoreMaterial(store, sm);
            if (exists) continue;

            StoreInventory inv = StoreInventory.builder()
                    .store(store)
                    .storeMaterial(sm)
                    .quantity(BigDecimal.ZERO)
                    .optimalQuantity(sm.getOptimalQuantity())
                    .status(InventoryStatus.SHORTAGE)
                    .build();

            inv.touchAfterQuantityChange();
            storeInventoryRepository.save(inv);
            created++;
        }
        return created;
    }

    /**
     * 가맹점 재고 입고 처리
     *
     * <p>
     * - storeId + storeMaterialId 로 StoreInventory 조회<br>
     * - 현재 수량에 입고 수량을 더하고, 상태/업데이트일시 동기화<br>
     * - StoreInventoryBatch 1건 생성 (간단 LOT, 유통기한 없음)
     * </p>
     */
    @Transactional
    public StoreInventoryRestockResponse restock(StoreInventoryRestockRequest request) {

        StoreInventory inventory = storeInventoryRepository.findById(request.getStoreInventoryId())
                .orElseThrow(() ->
                        new EntityNotFoundException("가맹점 재고를 찾을 수 없습니다. id=" + request.getStoreInventoryId()));

        BigDecimal before = inventory.getQuantity() != null
                ? inventory.getQuantity()
                : BigDecimal.ZERO;

        BigDecimal add = request.getQuantity() != null
                ? request.getQuantity()
                : BigDecimal.ZERO;

        // 수량 갱신
        inventory.setQuantity(before.add(add));
        inventory.touchAfterQuantityChange();   // 상태 + updateDate 동기화

        StoreMaterial sm = inventory.getStoreMaterial();

        return new StoreInventoryRestockResponse(
                inventory.getId(),
                inventory.getStore().getId(),
                sm.getId(),
                inventory.getQuantity(),
                inventory.getStatus()
        );
    }


    /** 가맹점 LOT 번호 생성 규칙(간단 버전) */
    private String generateLotNo(Store store, StoreMaterial storeMaterial) {
        // 예: S{storeId}-SM{storeMaterialId}-{yyyyMMddHHmmss}
        String ts = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        return "S" + store.getId() + "-SM" + storeMaterial.getId() + "-" + ts;
    }
}
