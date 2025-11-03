package com.boot.ict05_final_user.domain.order.entity;

import com.boot.ict05_final_user.domain.menu.entity.RecipeUnit;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 메뉴 재료 소진 기록 테이블 (menu_usage_material_log)
 * 주문별로 어떤 재료가 얼마나 사용되었는지를 기록
 */
@Entity
@Table(name = "menu_usage_material_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuUsageMaterialLog {

    /** 재료 소진 기록 시퀀스 (PK) */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "menu_usage_material_log_id")
    private Long id;

    /** 주문 시퀀스 (FK → customer_order) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_order_id_fk") //foreignKey = @ForeignKey(name = "fk_menu_usage_material_log_order"))
    private CustomerOrder customerOrder;

    /** 메뉴 시퀀스 (FK → menu) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_id_fk")  // foreignKey = @ForeignKey(name = "fk_menu_usage_material_log_menu"))
    private com.boot.ict05_final_user.domain.menu.entity.Menu menu;

    /** 매장 재료 시퀀스 (FK → store_material) */
    // @ManyToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "store_material_id_fk")  // foreignKey = @ForeignKey(name = "fk_menu_usage_material_log_store_material"))
    // private StoreMaterial storeMaterial;

    /** 재료 소진 수량 */
    @Column(name = "menu_usage_material_log_count")
    private BigDecimal count;

    /** 재료 소진 단위 (예: g, ml, 개 등) */
    @Column(name = "menu_usage_material_log_unit")
    private RecipeUnit unit;

    /** 재료 소진 기록 일자 */
    @Column(name = "menu_usage_material_log_date")
    private LocalDateTime date;

    /** 비고 */
    @Column(name = "menu_usage_material_log_memo")
    private String memo;
}
