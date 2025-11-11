package com.boot.ict05_final_user.domain.fcm.repository;

import com.boot.ict05_final_user.domain.fcm.repository.InventoryAlertQueryRepository;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * ⚠️ 스키마에 맞게 Q클래스/컬럼을 조정하세요.
 * 예시: QStoreInventory si (storeId, materialId, qty, expireAt)
 */
@Repository
@RequiredArgsConstructor
public class InventoryAlertQueryRepositoryImpl implements InventoryAlertQueryRepository {

    private final JPAQueryFactory query;

    @Override
    public List<Long> findStoresWithLowStock(int threshold) {
        // TODO: 실제 Q클래스 교체
        // QStoreInventory si = QStoreInventory.storeInventory;

        // return query.select(si.store.id)
        //         .from(si)
        //         .where(si.quantity.lt(threshold))
        //         .groupBy(si.store.id)
        //         .orderBy(Expressions.stringTemplate("NULL").asc()) // ORDER BY NULL
        //         .setHint("org.hibernate.readOnly", true)
        //         .setHint("org.hibernate.flushMode", "COMMIT")
        //         .setHint("javax.persistence.query.timeout", 3000)
        //         .fetch();

        // 임시 반환(스키마 매핑 전)
        return List.of();
    }

    @Override
    public List<Long> findStoresWithExpireSoon(LocalDate today, int days) {
        // TODO: 실제 Q클래스 교체
        // QStoreInventory si = QStoreInventory.storeInventory;
        // LocalDateTime start = today.atStartOfDay();
        // LocalDateTime endExclusive = today.plusDays(days).atStartOfDay();

        // return query.select(si.store.id)
        //         .from(si)
        //         .where(
        //             betweenClosedOpen(si.expireAt, start, endExclusive)
        //         )
        //         .groupBy(si.store.id)
        //         .orderBy(Expressions.stringTemplate("NULL").asc())
        //         .setHint("org.hibernate.readOnly", true)
        //         .setHint("org.hibernate.flushMode", "COMMIT")
        //         .setHint("javax.persistence.query.timeout", 3000)
        //         .fetch();

        return List.of();
    }

    // ===== 공통 WHERE 유틸 =====
    private BooleanExpression betweenClosedOpen(com.querydsl.core.types.dsl.DateTimePath<LocalDateTime> col,
                                                LocalDateTime start, LocalDateTime endExclusive) {
        return col.goe(start).and(col.lt(endExclusive));
    }
}
