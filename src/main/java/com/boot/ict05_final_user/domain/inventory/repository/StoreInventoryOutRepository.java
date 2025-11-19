package com.boot.ict05_final_user.domain.inventory.repository;

import com.boot.ict05_final_user.domain.inventory.entity.StoreInventoryOut;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 가맹점 출고 리포지토리
 * 기본 CRUD와 매장별 조회 제공
 */
public interface StoreInventoryOutRepository
        extends JpaRepository<StoreInventoryOut, Long>, StoreInventoryOutRepositoryCustom {

    /** 매장 기준 전체 조회 */
    List<StoreInventoryOut> findByStore_Id(Long storeId);

    StoreInventoryOut save(StoreInventoryOut entity);

    /** 동시성 방지를 위한 잠금 조회 예시 */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select so from StoreInventoryOut so where so.id = :id")
    StoreInventoryOut findByIdForUpdate(@Param("id") Long id);
}
