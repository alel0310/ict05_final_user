package com.boot.ict05_final_user.domain.inventory.entity;

import com.boot.ict05_final_user.domain.store.entity.Store;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 가맹점 재료(StoreMaterial) 엔티티
 *
 * <p>각 가맹점의 재료 정보를 관리한다.</p>
 * <ul>
 *   <li>본사 공급 재료(isHqMaterial = true) → material_id_fk 존재</li>
 *   <li>가맹점 자체 등록 재료(isHqMaterial = false) → material_id_fk = NULL</li>
 * </ul>
 * <p>
 * 본사 재료일 경우, 본사의 판매단위(salesUnit)를 가맹점 기준 단위로 사용한다.
 * 자체 등록 재료일 경우, 가맹점의 기본 단위를 직접 입력한다.
 * </p>
 */
@Entity
@Table(
        name = "store_material",
        uniqueConstraints = @UniqueConstraint(columnNames = {"store_id_fk", "store_material_code"})
)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreMaterial {

    /** 가맹점 재료 고유 ID */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "store_material_id", columnDefinition = "BIGINT UNSIGNED")
    @Comment("가맹점 재료 시퀀스")
    private Long id;

    /** 가맹점 (FK: store.store_id) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "store_id_fk",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_sm_store"),
            columnDefinition = "BIGINT UNSIGNED"
    )
    @Comment("매장 시퀀스 (FK)")
    private Store store;

    /** 본사 재료 (FK: material.material_id) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "material_id_fk",
            foreignKey = @ForeignKey(name = "fk_sm_material"),
            columnDefinition = "BIGINT UNSIGNED"
    )
    @Comment("본사 재료 (FK)")
    private Material material;

    /** 가맹점 재료 코드 (점포별 고유) */
    @Column(name = "store_material_code", length = 30, nullable = false,
            columnDefinition = "VARCHAR(30)")
    @Comment("가맹점 재료 코드(점포별 고유)")
    private String code;

    /** 가맹점 재료명 */
    @Column(name = "store_material_name", length = 100, nullable = false,
            columnDefinition = "VARCHAR(100)")
    @Comment("가맹점 재료명")
    private String name;

    /** 카테고리 */
    @Column(name = "store_material_category", length = 50,
            columnDefinition = "VARCHAR(50)")
    @Comment("가맹점 재료 카테고리")
    private String category;

    /** 기본 단위 (소진 단위, 가맹점 기준) */
    @Column(name = "store_material_base_unit", length = 20,
            columnDefinition = "VARCHAR(20)")
    @Comment("기본 단위(가맹점 기준)")
    private String baseUnit;

    /** 판매 단위 (본사 기준 단위, 본사 재료일 경우 참조됨) */
    @Column(name = "store_material_sales_unit", length = 20,
            columnDefinition = "VARCHAR(20)")
    @Comment("판매 단위(본사 기준)")
    private String salesUnit;

    /** 공급업체명 */
    @Column(name = "store_material_supplier", length = 100,
            columnDefinition = "VARCHAR(100)")
    @Comment("가맹점 재료 공급업체명")
    private String supplier;

    /** 보관온도 */
    @Enumerated(EnumType.STRING)
    @Column(name = "store_material_temperature",
            columnDefinition = "ENUM('TEMPERATURE','REFRIGERATE','FREEZE')")
    @Comment("보관온도")
    private MaterialTemperature temperature;

    /** 재료 상태 */
    @Enumerated(EnumType.STRING)
    @Column(name = "store_material_status", nullable = false,
            columnDefinition = "ENUM('USE','STOP') DEFAULT 'USE'")
    @Comment("재료 상태")
    private MaterialStatus status;

    /** 현재 수량 */
    @Column(name = "store_material_quantity", nullable = false, precision = 15, scale = 3,
            columnDefinition = "DECIMAL(15,3) DEFAULT 0")
    @Comment("현재 수량")
    private BigDecimal quantity;

    /** 적정 수량 */
    @Column(name = "store_material_optimal_quantity", precision = 15, scale = 3,
            columnDefinition = "DECIMAL(15,3)")
    @Comment("적정 수량")
    private BigDecimal optimalQuantity;

    /** 매입가 */
    @Column(name = "store_material_purchase_price",
            columnDefinition = "BIGINT")
    @Comment("매입가")
    private BigDecimal purchasePrice;

    /** 판매가 */
    @Column(name = "store_material_selling_price",
            columnDefinition = "BIGINT")
    @Comment("판매가")
    private BigDecimal sellingPrice;

    /** 유통기한 */
    @Column(name = "store_material_expiration_date",
            columnDefinition = "DATE")
    @Comment("유통기한")
    private LocalDate expirationDate;

    /** 본사 재료 여부 (1=본사, 0=가맹점 자체 등록) */
    @Column(name = "store_material_is_hq_material", nullable = false,
            columnDefinition = "TINYINT(1) DEFAULT 0")
    @Comment("본사 재료 여부")
    private boolean isHqMaterial;

    /** 등록일 */
    @CreationTimestamp
    @Column(name = "store_material_reg_date", nullable = false,
            columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP")
    @Comment("등록일")
    private LocalDateTime regDate;

    /** 수정일 */
    @UpdateTimestamp
    @Column(name = "store_material_modify_date",
            columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
    @Comment("수정일")
    private LocalDateTime modifyDate;
}