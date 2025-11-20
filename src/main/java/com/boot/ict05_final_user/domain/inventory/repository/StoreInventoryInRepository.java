package com.boot.ict05_final_user.domain.inventory.repository;

import com.boot.ict05_final_user.domain.inventory.entity.StoreInventoryIn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 가맹점 입고 리포지토리
 * 기본 CRUD와 매장별 조회 제공
 */
public interface StoreInventoryInRepository
        extends JpaRepository<StoreInventoryIn, Long>, StoreInventoryInRepositoryCustom {

    /** 매장 기준 전체 조회 */
    List<StoreInventoryIn> findByStore_Id(Long storeId);


    /**
     * 해당 가맹점 재료의 최근 입고 단가 1건
     */
    @Query("""
        select i.unitPrice
        from StoreInventoryIn i
        where i.storeMaterial.id = :storeMaterialId
        order by i.createdAt desc
    """)
    Optional<BigDecimal> findLatestUnitPriceByStoreMaterialId(Long storeMaterialId);
}
