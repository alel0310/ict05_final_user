package com.boot.ict05_final_user.domain.menu.dto;

import com.boot.ict05_final_user.domain.menu.entity.MenuCategory;
import com.boot.ict05_final_user.domain.menu.entity.MenuShow;
import com.boot.ict05_final_user.domain.menu.entity.SoldOutStatus;
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
    private String  menuCategoryName;

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

    /** 판매중 / 품절 */
    private SoldOutStatus soldOutStatus;

    /** 설명 */
    private String menuInformation;

    /** 재료 */
    private String ingredients;


}
