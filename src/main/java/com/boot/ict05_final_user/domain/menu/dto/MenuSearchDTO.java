package com.boot.ict05_final_user.domain.menu.dto;

import com.boot.ict05_final_user.domain.menu.entity.MenuShow;
import lombok.Data;

@Data
public class MenuSearchDTO {

    /** 검색어 */
    private String s;

    /** 검색 타입 (name/info/all) */
    private String type;

    /** 페이지 사이즈 */
    private String size = "10";

    private MenuShow menuShow;

    // 필터 키 (안정성)
    private Long menuCategoryId;

    // 선택된 카테고리 이름 (표시용; 서버에서 채워서 내려줌)
    private String menuCategoryName;

}

