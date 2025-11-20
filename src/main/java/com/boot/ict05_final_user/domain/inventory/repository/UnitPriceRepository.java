package com.boot.ict05_final_user.domain.inventory.repository;


import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.Optional;


/**
 * HQ 단가 조회 리포지토리
 * - unit_price_type: 'PURCHASE' | 'SELLING'
 * - 최신 판매가: SELLING, 가장 최근(from) 우선
 */
public interface UnitPriceRepository {

    /**
     * HQ 재료의 최신 '판매가'
     *
     */
    /** material_id의 최신 SELLING 단가 1건 (date_to null 우선, 없으면 date_from 최신) */
    @Query("""
        select u.unitPriceSelling
        from UnitPrice u
        where u.material.id = :materialId
          and u.unitPriceType = 'SELLING'
        order by coalesce(u.unitPriceDateTo, timestamp '9999-12-31 00:00:00') desc,
                 u.unitPriceDateFrom desc
    """)
    Optional<BigDecimal> findLatestSellingPriceByMaterialId(Long materialId);
}
