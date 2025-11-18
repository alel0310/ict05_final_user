package com.boot.ict05_final_user.domain.inventory.repository;

import com.boot.ict05_final_user.domain.inventory.entity.StoreInventory;
import com.boot.ict05_final_user.domain.inventory.entity.StoreMaterial;
import com.boot.ict05_final_user.domain.store.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StoreInventoryRepository
        extends JpaRepository<StoreInventory, Long>, StoreInventoryRepositoryCustom {

    /** 매장별 재고 목록 */
    List<StoreInventory> findByStore_Id(Long storeId);

    /** 특정 매장의 모든 재고 */
    List<StoreInventory> findByStore(Store store);

    /** 매장 + 가맹점 재료 기준 존재 여부 체크 */
    boolean existsByStoreAndStoreMaterial(Store store, StoreMaterial storeMaterial);

    /** 매장+재료로 조회 **/
    Optional<StoreInventory> findByStore_IdAndStoreMaterial_Id(Long storeId, Long storeMaterialId);
}
