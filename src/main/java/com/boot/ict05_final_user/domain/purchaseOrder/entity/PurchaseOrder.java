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

    /** 발주 시퀀스 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "purchase_order_id", columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    /** 발주 코드 */
    @Column(name = "purchase_order_code", length = 32, nullable = false, unique = true)
    private String orderCode;

    /** 발주 대표 품목명 */
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

    /** 총 개수 */
    @Column(name = "purchase_order_total_count", columnDefinition = "INT UNSIGNED DEFAULT 0")
    private Integer totalCount;

    /** 비고 */
    @Column(name = "purchase_order_remark", columnDefinition = "TEXT")
    @JsonProperty("notes")
    private String remark;

    /** 공급업체명 */
    @Column(name = "purchase_order_supplier", length = 100, nullable = false)
    private String supplier;

    /** 상태 (RECEIVED, SHIPPING, DELIVERED) */
    @Enumerated(EnumType.STRING)
    @Column(name = "purchase_order_status")
    private PurchaseOrderStatus status;

    /** 우선순위 (NORMAL, URGENT) */
    @Enumerated(EnumType.STRING)
    @Column(name = "purchase_order_priority")
    private PurchaseOrderPriority priority;

    /** 배송 예정일 */
    @Column(name = "purchase_order_delivery_date")
    private LocalDate deliveryDate;

    /** 실제 납기일 */
    @Column(name = "purchase_order_actual_delivery_date")
    private LocalDate actualDeliveryDate;

    /** 발주 상세 항목들 */
    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL)
    private List<PurchaseOrderDetail> details;
}
