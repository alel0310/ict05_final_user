package com.boot.ict05_final_user.domain.menu.entity;

import com.boot.ict05_final_user.domain.order.entity.CustomerOrder;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 메뉴 재료 소진 기록(menu_usage_material_log)
 *
 * 주문 발생 시 어떤 메뉴 때문에 어떤 매장 재료가 얼마나 소진됐는지 기록
 */
@Entity
@Table(name = "menu_usage_material_log")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuUsageMaterialLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "menu_usage_material_log_id",
            columnDefinition = "BIGINT UNSIGNED COMMENT '재료 소진 기록 시퀀스'")
    private Long id;

    /** 주문 시퀀스 (FK: customer_order.customer_order_id) */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "customer_order_id_fk",
            nullable = false,
            columnDefinition = "BIGINT UNSIGNED COMMENT '주문 시퀀스 (FK)'"
    )
    private CustomerOrder customerOrderFk;

    /** 메뉴 시퀀스 (FK: menu.menu_id) */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "menu_id_fk",
            nullable = false,
            columnDefinition = "BIGINT UNSIGNED COMMENT '메뉴 시퀀스 (FK)'"
    )
    private Menu menuFk;

    /** 매장 재료 시퀀스 (FK: store_material.store_material_id) */
//    @ManyToOne(fetch = FetchType.LAZY, optional = false)
//    @JoinColumn(
//            name = "store_material_id_fk",
//            nullable = false,
//            columnDefinition = "BIGINT UNSIGNED COMMENT '매장 재료 시퀀스 (FK)'"
//    )
//    private StoreMaterial storeMaterialFk;

    @Column(name = "menu_usage_material_log_count",
            nullable = false,
            precision = 15,
            scale = 3,
            columnDefinition = "DECIMAL(15,3) COMMENT '재료 소진 수량'")
    private BigDecimal count;

    @Column(name = "menu_usage_material_log_unit",
            length = 20,
            nullable = false,
            columnDefinition = "VARCHAR(20) COMMENT '재료 소진 단위'")
    private String unit;

    @CreationTimestamp
    @Column(name = "menu_usage_material_log_date",
            nullable = false,
            columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '재료 소진 기록 일자'")
    private LocalDateTime logDate;

    @Column(name = "menu_usage_material_log_memo",
            columnDefinition = "VARCHAR(255) COMMENT '비고'")
    private String memo;
}


