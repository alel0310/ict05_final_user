package com.boot.ict05_final_user.domain.inventory.repository;

import com.boot.ict05_final_user.domain.inventory.entity.StoreInventory;
import com.boot.ict05_final_user.domain.inventory.entity.StoreInventoryAdjustment;
import com.boot.ict05_final_user.domain.inventory.entity.StoreMaterial;
import com.boot.ict05_final_user.domain.store.entity.Store;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * 가맹점 재고 리포지토리
 */
public interface StoreInventoryRepository
        extends JpaRepository<StoreInventory, Long>, StoreInventoryRepositoryCustom {
    /** 매장별 재고 목록 */
    List<StoreInventory> findByStore_Id(Long storeId);

    /** 특정 매장의 모든 재고 */
    List<StoreInventory> findByStore(Store store);

    /** 매장 가맹점 재료 기준 존재 여부 체크 */
    boolean existsByStoreAndStoreMaterial(Store store, StoreMaterial storeMaterial);

    /** 매장 재료로 조회 */
    Optional<StoreInventory> findByStore_IdAndStoreMaterial_Id(Long storeId, Long storeMaterialId);

    /** 서비스 포트 시그니처와 맞춘 프록시 메서드 */
    default Optional<StoreInventory> findByStoreIdAndStoreMaterialId(Long storeId, Long storeMaterialId) {
        return findByStore_IdAndStoreMaterial_Id(storeId, storeMaterialId);
    }

    // Optional<StoreInventory> findByStoreIdAndStoreMaterialId(Long storeId, Long storeMaterialId);

    StoreInventory save(StoreInventory entity);

    /** 경합 방지를 위한 비관적 잠금 조회 */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select si from StoreInventory si " +
            "where si.store.id = :storeId and si.storeMaterial.id = :storeMaterialId")
    Optional<StoreInventory> findByStoreIdAndStoreMaterialIdForUpdate(@Param("storeId") Long storeId,
                                                                      @Param("storeMaterialId") Long storeMaterialId);
}
