package com.boot.ict05_final_user.domain.inventory.repository;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public class UnitPriceJdbcRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public UnitPriceJdbcRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** HQ 재료의 최신 SELLING 단가 1건
     *  - material_id_fk 기준
     *  - 유효기간 미적용: 단순 최신 정렬로 선택
     *  - 가맹점 입고 단가로 사용(HQ의 판매가)
     */
    public Optional<BigDecimal> findLatestSellingPriceByMaterialId(Long materialId) {
        String sql = """
            SELECT unit_price_selling
              FROM unit_price
             WHERE material_id_fk = :materialId
               AND unit_price_type = 'SELLING'
          ORDER BY COALESCE(unit_price_date_to, TIMESTAMP('9999-12-31 00:00:00')) DESC,
                   unit_price_date_from DESC
             LIMIT 1
        """;
        return jdbc.query(sql,
                new MapSqlParameterSource("materialId", materialId),
                rs -> rs.next() ? Optional.of(rs.getBigDecimal(1)) : Optional.empty()
        );
    }
}
