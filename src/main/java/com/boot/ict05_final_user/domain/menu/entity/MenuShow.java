package com.boot.ict05_final_user.domain.menu.entity;

/**
 * 메뉴 상태 Enum
 *
 * <p>메뉴 상태 분류를 정의하며, 각 항목은 한글 설명(description)을 가진다.</p>
 *
 * <p>주요 상태:</p>
 * <ul>
 *     <li>GO: 판매중</li>
 *     <li>STOP: 판매중지</li>
 * </ul>
 */
public enum MenuShow {

    SHOW("판매중"),

    HIDE("판매중지");

    /** 한글 설명 */
    private final String description;

    /**
     * 생성자
     *
     * @param description 각 상태의 한글 설명
     */
    MenuShow(String description)  { this.description = description; }

    /**
     *  메뉴 한글 설명을 반환한다
     *
     * @return 카테고리 설명
     * */
    public String getDescription() {
        return description;
    }
}
