package com.boot.ict05_final_user.domain.menu.dto;

import com.boot.ict05_final_user.domain.menu.entity.MenuShow;
import jakarta.validation.constraints.DecimalMin;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class MenuModifyFormDTO {

    /** 수정 대상 메뉴 ID */
    private Long menuId;

    /** 메뉴 카테고리 ID (필요시 함께 전달) */
    private Long menuCategoryId;

    /** 카테고리 */
    private String menuCategory;

    /** 판매 상태 */
    private MenuShow menuShow;

    /** 메뉴코드 */
    private String menuCode;

    /** 메뉴명 */
    private String menuName;

    /** 영문명  */
    private String menuNameEnglish;

    /** 가격 */
    @DecimalMin("0.0")
    private BigDecimal menuPrice;

    /** 설명 */
    private String menuInformation;

    /** 칼로리(kcal) */
    private Integer menuKcal;

    /** 재료구성 – 주재료 (menuRecipeId 포함됨) */
    private List<RecipeItemDTO> mainMaterials;

    /** 재료구성 – 소스 (menuRecipeId 포함됨) */
    private List<RecipeItemDTO> sauceMaterials;

}
