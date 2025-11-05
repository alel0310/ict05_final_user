package com.boot.ict05_final_user.domain.menu.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity     // DB 테이블이랑 연결
@Table(name = "menu_category")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder    // 객체를 만드는 방법을 제공
public class MenuCategory {

    @Id     // PK
    @GeneratedValue(strategy = GenerationType.IDENTITY)     // id 숫자를 자동 증가
    @Column(name = "menu_category_id")
    private Long menuCategoryId;

    /** 상위 카테고리 (대중소 구조 지원) */
    @ManyToOne(fetch = FetchType.LAZY)      // 1개의 자식 카테고리(소)는 1개의 부모 카테고리(상위)를 참조 / LAZY(지연로딩): 진짜 필요할 때만 DB에서 부모 가져옴
    @JoinColumn(name = "menu_category_parent_id")
    private MenuCategory menuCategoryParentId;

    /** 카테고리명 */
    @Column(name = "menu_category_name")
    private String menuCategoryName;

    /** 단계 구분(대=1, 중=2, 소=3) */
    @Column(name = "menu_category_level")
    private Short menuCategoryLevel;


}
