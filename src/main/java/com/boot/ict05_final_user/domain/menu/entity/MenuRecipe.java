package com.boot.ict05_final_user.domain.menu.entity;

import com.boot.ict05_final_user.domain.material.entity.Material;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuRecipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "menu_recipe_id")
    private Long menuRecipeId;

    @Column(name = "recipe_item_name", length = 100, nullable = false)
    private String recipeItemName;   // 항목명

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "menu_id_fk", nullable = false)
    private Menu menu;

    @ManyToOne(optional = true, fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id_fk", nullable = true)
    private Material material;

    @Column(name = "recipe_qty", precision = 12, scale = 3, nullable = false)
    private BigDecimal recipeQty;

    @Column(name = "recipe_unit", length = 20, nullable = false)
    @Enumerated(EnumType.STRING)
    private RecipeUnit recipeUnit;

    @Enumerated(EnumType.STRING)
    @Column(name = "recipe_role", nullable = false)
    private RecipeRole recipeRole; // MAIN / SAUCE / TOPPING

    @Column(name = "recipe_sort", nullable = false)
    private Integer recipeSort;

    public enum RecipeRole { MAIN, SAUCE }
}
