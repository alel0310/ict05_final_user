package com.boot.ict05_final_user.domain.fcm.repository;

import java.time.LocalDate;
import java.util.List;

/**
 * 재고부족/유통임박 대상을 찾는 쿼리 집합.
 * 실제 테이블/컬럼명에 맞게 Impl 내부를 조정하세요.
 */
public interface InventoryAlertQueryRepository {

    /** 재고부족: 수량이 threshold 미만인 (storeId, materialId) 묶음 → storeId만 우선 반환 */
    List<Long> findStoresWithLowStock(int threshold);

    /** 유통임박: 유통기한이 [today, today+days) 구간에 존재하는 storeId */
    List<Long> findStoresWithExpireSoon(LocalDate today, int days);
}
