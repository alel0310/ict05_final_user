package com.boot.ict05_final_user.domain.inventory.repository;

import com.boot.ict05_final_user.domain.inventory.entity.StoreInventoryBatch;
import com.boot.ict05_final_user.domain.inventory.entity.StoreInventory;
import com.boot.ict05_final_user.domain.inventory.entity.StoreMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StoreInventoryBatchRepository extends JpaRepository<StoreInventoryBatch, Long>, StoreInventoryBatchRepositoryCustom {

    /**
     * 특정 가맹점 재고에 속한 배치 목록
     */
    List<StoreInventoryBatch> findByStoreInventory(StoreInventory storeInventory);

    /**
     * 특정 가맹점 재료에 대한 모든 배치
     */
    List<StoreInventoryBatch> findByStoreMaterial(StoreMaterial storeMaterial);

    /**
     * (옵션) 특정 매장 + 유통기한 구간 배치 조회
     *  - FCM 쿼리는 QueryDSL에서 직접 짜고 있으니,
     *    필요 없으면 이 메서드는 생략 가능.
     */
    List<StoreInventoryBatch> findByStoreInventory_Store_IdAndExpirationDateBetween(
            Long storeId,
            LocalDate start,
            LocalDate endExclusive
    );
}
