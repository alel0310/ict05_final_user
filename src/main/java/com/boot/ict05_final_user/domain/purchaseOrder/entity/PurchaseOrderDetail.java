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

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "purchase_order_detail_id")
    private Long id;

    /** 발주 헤더 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_order_id_fk", nullable = false)
    private PurchaseOrder purchaseOrder;

    /** 발주 품목 Material */
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "material_id_fk", nullable = false)
//    private Material material;

    /** 단가 : 등록 시 Material.unitPrice 사용 */
    @Column(name = "purchase_order_detail_unit_price", precision = 12, scale = 2, nullable = false)
    private BigDecimal unitPrice;

    /** 단위 : Material.unit 사용 (DTO에서만 필요할 수 있음) */
    @Transient
    private String unit;

    /** 수량 : 등록 시 입력값 */
    @Column(name = "purchase_order_detail_count", nullable = false)
    private Integer count;

    /** 총액 = 단가 * 수량 */
    @Column(name = "purchase_order_detail_total_price", precision = 12, scale = 2, nullable = false)
    private BigDecimal totalPrice;
}

