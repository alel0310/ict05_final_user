package com.boot.ict05_final_user.domain.menu.entity;

import com.boot.ict05_final_user.domain.store.entity.Store;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "store_menu",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_store_menu_store_menu",
                        columnNames = {"store_id_fk", "menu_id_fk"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreMenu {

    /** 가맹점 메뉴 시퀀스 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "store_menu_id")
    private Long storeMenuId;

    /** 메뉴 FK */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "menu_id_fk")
    private Menu menu;

    /** 매장 FK */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_id_fk")
    private Store store;

    /** 품절 상태 */
    @Builder.Default
    @Column(name = "store_menu_soldout")
    @Convert(converter = StoreMenuSoldoutConverter.class)
    private StoreMenuSoldout storeMenuSoldout = StoreMenuSoldout.ON_SALE;

    /** 품절/해제 토글 */
    public void toggleSoldOut() {
        this.storeMenuSoldout =
                (this.storeMenuSoldout == StoreMenuSoldout.ON_SALE)
                        ? StoreMenuSoldout.SOLD_OUT
                        : StoreMenuSoldout.ON_SALE;
    }

}
