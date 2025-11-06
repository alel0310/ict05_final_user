package com.boot.ict05_final_user.domain.purchaseOrder.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * 가맹점 발주 상세 엔티티 (Purchase Order Detail)
 * DB 테이블명: purchase_order_detail
 */
@Entity
@Table(name = "purchase_order_detail")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseOrderDetail {
    /** 발주 상세 시퀀스 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "purchase_order_detail_id")
    private Long id;

    /** 발주 본문 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_order_id_fk", nullable = false)
    private PurchaseOrder purchaseOrder;

//    /** 재고 */
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "inventory_id_fk", nullable = false)
//    private Inventory inventory;
//
//    /** 재료 */
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "material_id_fk", nullable = false)
//    private Material material;

    /** 단가 */
    @Column(name = "purchase_order_detail_unit_price", precision = 12, scale = 2, nullable = false)
    private BigDecimal unitPrice;

    /** 수량 */
    @Column(name = "purchase_order_detail_count", nullable = false)
    private Integer count;

    /** 총액 */
    @Column(name = "purchase_order_detail_total_price", precision = 12, scale = 2, nullable = false)
    private BigDecimal totalPrice;
}
