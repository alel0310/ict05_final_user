package com.boot.ict05_final_user.domain.fcm.repository;

import com.boot.ict05_final_user.domain.fcm.repository.InventoryAlertQueryRepository;
import com.boot.ict05_final_user.domain.inventory.entity.InventoryStatus;
import com.boot.ict05_final_user.domain.inventory.entity.QStoreInventory;
import com.boot.ict05_final_user.domain.material.entity.QStoreMaterial;
import com.boot.ict05_final_user.domain.inventory.entity.QStoreInventoryBatch;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class InventoryAlertQueryRepositoryImpl implements InventoryAlertQueryRepository {

    private final JPAQueryFactory query;

    /**
     * 재고부족:
     *  - quantity < threshold
     *  - OR status = LOW / SHORTAGE
     *  - OR optimalQuantity 존재 & quantity < optimalQuantity
     */
    @Override
    public List<Long> findStoresWithLowStock(int threshold) {
        QStoreInventory si = QStoreInventory.storeInventory;
        QStoreMaterial sm = QStoreMaterial.storeMaterial;
        QStoreInventoryBatch sib = QStoreInventoryBatch.storeInventoryBatch;

        BigDecimal th = BigDecimal.valueOf(threshold);

        BooleanExpression cond =
                si.quantity.lt(th)
                        .or(si.status.eq(InventoryStatus.LOW))
                        .or(si.status.eq(InventoryStatus.SHORTAGE))
                        .or(
                                si.optimalQuantity.isNotNull()
                                        .and(si.quantity.lt(si.optimalQuantity))
                        );

        return query
                .select(si.store.id)
                .from(si)
                .where(cond)
                .groupBy(si.store.id)
                .orderBy(orderByNull()) // 👈 filesort 방지용
                .setHint("org.hibernate.readOnly", true)
                .setHint("org.hibernate.flushMode", "COMMIT")
                .setHint("jakarta.persistence.query.timeout", 3000)
                .fetch();
    }

    /**
     * 유통임박:
     *  - store_material.expiration_date ∈ [today, today+days)
     */
    @Override
    public List<Long> findStoresWithExpireSoon(LocalDate today, int days) {
        QStoreInventory si = QStoreInventory.storeInventory;
        QStoreMaterial sm = QStoreMaterial.storeMaterial;
        QStoreInventoryBatch sib = QStoreInventoryBatch.storeInventoryBatch;

        LocalDate start = today;
        LocalDate endExclusive = today.plusDays(days);

        BooleanExpression cond =
                sib.expirationDate.isNotNull()
                        .and(sib.expirationDate.goe(start))
                        .and(sib.expirationDate.lt(endExclusive));

        return query
                .select(si.store.id)
                .from(si)
                .join(si.storeMaterial, sm)
                .where(cond)
                .groupBy(si.store.id)
                .orderBy(orderByNull()) // 👈 동일
                .setHint("org.hibernate.readOnly", true)
                .setHint("org.hibernate.flushMode", "COMMIT")
                .setHint("jakarta.persistence.query.timeout", 3000)
                .fetch();
    }

    /**
     * ORDER BY NULL (MySQL/MariaDB filesort 회피용)
     */
    private OrderSpecifier<Integer> orderByNull() {
        return new OrderSpecifier<>(Order.ASC, Expressions.nullExpression());
    }
}
