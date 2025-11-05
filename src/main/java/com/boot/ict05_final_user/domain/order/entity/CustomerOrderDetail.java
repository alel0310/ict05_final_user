package com.boot.ict05_final_user.domain.order.entity;

import com.boot.ict05_final_user.domain.menu.entity.Menu;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.math.BigDecimal;

/**
 * 주문 상세(CustomerOrderDetail) 엔티티
 *
 * <p>주문에 포함된 개별 메뉴/수량/단가/금액 정보를 담는다.</p>
 */
@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "customer_order_detail")
public class CustomerOrderDetail {

    /** 주문 상세 시퀀스 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "customer_order_detail_id")
    private Long id;

    /** 주문(FK) */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_order_id_fk", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @Setter
    private CustomerOrder order;

    /** 메뉴 시퀀스(FK) */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "menu_id_fk", nullable = false)
    private Menu menuIdFk;

    /** 주문 수량 */
    @Column(name = "customer_order_detail_quantity", nullable = false)
    private Integer quantity;

    /** 단가 (당시 메뉴 가격 스냅샷) */
    @Column(name = "customer_order_detail_unit_price", precision = 15, scale = 2, nullable = false)
    private BigDecimal unitPrice;

    /** 주문 금액(해당 라인 총액 = 단가 × 수량) */
    @Column(name = "customer_order_detail_total", precision = 15, scale = 2, nullable = false)
    private BigDecimal lineTotal;

    /** 단가 × 수량 자동 계산 */
    @PrePersist
    @PreUpdate
    void calculateLineTotal() {
        if (quantity == null) quantity = 1;
        if (unitPrice == null) unitPrice = BigDecimal.ZERO;
        this.lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
    }
}