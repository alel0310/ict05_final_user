package com.boot.ict05_final_user.domain.inventory.entity;

import com.boot.ict05_final_user.domain.store.entity.Store;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Comment;

/**
 * 가맹점 재고(StoreInventory) 엔티티
 *
 * <p>각 매장의 현재 재고, 적정 수량, 상태를 관리한다.</p>
 * <p>본사 Inventory와 StoreMaterial을 기반으로 재고를 추적한다.</p>
 */
@Entity
@Table(name = "store_inventory",
        uniqueConstraints = @UniqueConstraint(name = "uq_store_inv",
                columnNames = {"store_id_fk", "store_material_id_fk"}))

@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@SuperBuilder
@Getter
@Comment("가맹점 재고")
public class StoreInventory extends InventoryBase {

    /** 가맹점 재고 시퀀스 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "store_inventory_id", columnDefinition = "BIGINT UNSIGNED")
    @Comment("가맹점 재고 시퀀스")
    private Long id;

    /** 가맹점 (FK: store.store_id) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id_fk", nullable = false,
            foreignKey = @ForeignKey(name = "fk_si_store"))
    private Store store;

    /** 가맹점 재료 (FK: store_material.store_material_id) */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_material_id_fk", nullable = false,
            foreignKey = @ForeignKey(name = "fk_si_store_material"))
    private StoreMaterial storeMaterial;
}
