package com.boot.ict05_final_user.domain.menu.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Menu {

    /** 메뉴 고유 ID */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "menu_id")
    private Long menuId;

    /** 메뉴명 */
    @Column(name = "menu_name")
    private String menuName;

    /** 메뉴코드 */
    @Column(name = "menu_code")
    private String menuCode;

    /** 메뉴 설명 */
    private String menuInformation;

    /** 메뉴 영문명 */
    private String menuNameEnglish;

    /** 메뉴 칼로리 */
    @Column(name = "menu_kcal")
    private Integer menuKcal;

    /** 품절 상태 */
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "sold_out_status")
    private SoldOutStatus soldOutStatus = SoldOutStatus.ON_SALE;

    /** 판매상태(0:중지, 1:판매중) */
    @Enumerated(EnumType.STRING)
    @Column(name = "menu_show")
    private MenuShow menuShow;

    /** 가격 */
    @Column(name = "menu_price")
    private BigDecimal menuPrice;

    /** 레시피(연결엔티티) */
    @OneToMany(mappedBy = "menu", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MenuRecipe> recipe = new ArrayList<>();

    /** menuCategory 참조 */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name= "menu_category_id_fk")
    private MenuCategory menuCategory;

    /** 재료 */
    @Column(name = "ingredients", length = 500)
    private String ingredients;

    /** 카테고리 교체 */
    public void changeCategory(MenuCategory category) { this.menuCategory = category; }

}

