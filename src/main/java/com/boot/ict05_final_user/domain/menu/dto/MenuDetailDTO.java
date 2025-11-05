package com.boot.ict05_final_user.domain.menu.dto;

import com.boot.ict05_final_user.domain.menu.entity.MenuCategory;
import com.boot.ict05_final_user.domain.menu.entity.MenuShow;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
public class MenuDetailDTO {

    /** 메뉴 고유 ID */
    private Long menuId;

    /** 메뉴 카테고리 ID (필요시 함께 전달) */
    private Long menuCategoryId;

    /** 메뉴 카테고리 */
    private MenuCategory menuCategory;

    /** 판매 상태 */
    private MenuShow menuShow;

    /** 메뉴코드 */
    private String menuCode;

    /** 메뉴명 */
    private String menuName;

    /** 영문명 */
    private String menuNameEnglish;

    /** 가격 */
    private BigDecimal menuPrice;

    /** 칼로리 */
    private Integer menuKcal;

    /** 설명 */
    private String menuInformation;

    /** 재료구성 */
    private List<RecipeItemDTO> mainMaterials;  // 주재료 리스트
    private List<RecipeItemDTO> sauceMaterials; // 소스 구성 테이블

}
