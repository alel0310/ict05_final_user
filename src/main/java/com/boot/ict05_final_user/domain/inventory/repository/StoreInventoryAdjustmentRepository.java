package com.boot.ict05_final_user.domain.inventory.repository;

import com.boot.ict05_final_user.domain.inventory.entity.StoreInventoryAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 가맹점 재고 조정 리포지토리
 * 기본 CRUD와 매장 기준 조회 제공
 */
public interface StoreInventoryAdjustmentRepository
        extends JpaRepository<StoreInventoryAdjustment, Long>, StoreInventoryAdjustmentRepositoryCustom {

    List<StoreInventoryAdjustment> findByStoreInventory_Store_Id(Long storeId);

}
