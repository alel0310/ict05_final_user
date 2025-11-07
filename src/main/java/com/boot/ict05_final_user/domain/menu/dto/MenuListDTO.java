package com.boot.ict05_final_user.domain.menu.dto;

import com.boot.ict05_final_user.domain.menu.entity.MenuShow;
import com.boot.ict05_final_user.domain.menu.entity.SoldOutStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data       // getter, setter, toString 등 기본 메서드
@AllArgsConstructor     // 매개변수 생성자
@NoArgsConstructor      // 디폴트 생성자
public class MenuListDTO {

    /** 메뉴 시퀀스 */
    private Long menuId;

    /** 판매상태(true: 판매중 / false: 중단) */
    private MenuShow menuShow;

    /** 메뉴명 */
    private String menuName;

//    /** 메뉴 코드 */
//   private String menuCode;

    /** 메뉴 카테고리 ID (필요시 함께 전달) */
    private Long menuCategoryId;

    /** 카테고리명 */
    private String menuCategoryName;

//    /** 주재료 리스트 */
//    private List<String> materialNames;

    /** 가격 */
    private BigDecimal menuPrice;

//    /** 메뉴 칼로리 */
//    private Integer menuKcal;

    /** 재고상태 */
    private SoldOutStatus soldOutStatus;

    /** 한글 라벨 : 카테고리 */
    public String getMenuCategoryLabel() {
        return menuCategoryName != null ? menuCategoryName : "";
    }

//    /** 화면에서 문자열로 쓸 때 */
//    public String getMaterialNamesJoined() {
//        return materialNames != null ? String.join(", ", materialNames) : "";
//    }
}