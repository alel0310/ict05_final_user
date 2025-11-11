package com.boot.ict05_final_user.domain.purchaseOrder.repository;

import com.boot.ict05_final_user.domain.purchaseOrder.entity.PurchaseOrder;
import com.boot.ict05_final_user.domain.purchaseOrder.entity.PurchaseOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long>, PurchaseOrderRepositoryCustom {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query(
            value = "UPDATE purchase_order " +
                    "SET purchase_order_status = :#{#status.name()} " +
                    "WHERE purchase_order_id = :id",
            nativeQuery = true
    )
    int updateStatusById(@Param("id") Long id,
                         @Param("status") PurchaseOrderStatus status);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query(
            value = "UPDATE purchase_order " +
                    "SET purchase_order_status = :#{#status.name()} " +
                    "WHERE purchase_order_code = :orderCode",
            nativeQuery = true
    )
    int updateStatusByOrderCode(@Param("orderCode") String orderCode,
                                @Param("status") PurchaseOrderStatus status);



}
