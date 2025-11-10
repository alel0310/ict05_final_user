package com.boot.ict05_final_user.domain.inventory.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Comment;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 재고(Inventory) 공통 추상 클래스.
 *
 * <p>본사(HqInventory), 가맹점(StoreInventory)의 공통 필드를 정의한다.</p>
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@MappedSuperclass
public abstract class Inventory {

    /** 현재 재고 수량 */
    @Setter
    @Column(name = "inventory_quantity", precision = 15, scale = 3, nullable = false,
            columnDefinition = "DECIMAL(15,3) DEFAULT 0.000")
    @Comment("현재 재고 수량")
    protected BigDecimal quantity;

    /** 적정 재고 수량 */
    @Setter
    @Column(name = "inventory_optimal_quantity", precision = 15, scale = 3,
            columnDefinition = "DECIMAL(15,3)")
    @Comment("적정 재고 수량")
    protected BigDecimal optimalQuantity;

    /** 재고 상태 */
    @Setter
    @Enumerated(EnumType.STRING)
    @Column(name = "inventory_status", nullable = false, length = 20)
    @Comment("재고 상태")
    protected InventoryStatus status;

    /** 마지막 업데이트 일시 */
    @Setter
    @Column(name = "inventory_update_date", nullable = false,
            columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP")
    @Comment("재고 수정일")
    protected LocalDateTime updateDate;

    /** 생성 및 수정 시 자동 갱신 */
    @PrePersist
    @PreUpdate
    public void updateTimestamp() {
        this.updateDate = LocalDateTime.now();
    }
}
