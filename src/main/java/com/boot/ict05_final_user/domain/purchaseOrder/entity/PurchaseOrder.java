package com.boot.ict05_final_user.domain.purchaseOrder.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * 가맹점 발주 엔티티 (Purchase Order)
 * DB 테이블명: purchase_order
 */
@Entity
@Table(name = "purchase_order")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "purchase_order_id", columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "purchase_order_code", length = 32, nullable = false, unique = true)
    private String orderCode;

    /** Material에서 가져오는 대표 품목명 */
    @Column(name = "purchase_order_main_item_name", length = 100)
    private String mainItemName;

    /** 한 발주 내 품목 수 */
    @Column(name = "purchase_order_item_count")
    private Integer itemCount;

    /** 발주 주문일 */
    @Column(name = "purchase_order_date", nullable = false)
    private LocalDate orderDate;

    /** 총액 */
    @Column(name = "purchase_order_total_price", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalPrice = BigDecimal.ZERO;

    /** 발주 비고 */
    @Column(name = "purchase_order_remark", columnDefinition = "TEXT")
    private String remark;

    /** Material에서 가져오는 공급업체명 */
    @Column(name = "purchase_order_supplier", length = 100, nullable = false)
    private String supplier;

    @Enumerated(EnumType.STRING)
    @Column(name = "purchase_order_status")
    private PurchaseOrderStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "purchase_order_priority")
    private PurchaseOrderPriority priority;

    @Column(name = "purchase_order_delivery_date")
    private LocalDate deliveryDate;

    @Column(name = "purchase_order_actual_delivery_date")
    private LocalDate actualDeliveryDate;

    /** 발주 상세 항목들 */
    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseOrderDetail> details;
}
