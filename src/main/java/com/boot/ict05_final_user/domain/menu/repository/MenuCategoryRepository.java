package com.boot.ict05_final_user.domain.menu.repository;

import com.boot.ict05_final_user.domain.menu.entity.MenuCategory;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface MenuCategoryRepository extends JpaRepository<MenuCategory, Long> {
    List<MenuCategory> findAllByMenuCategoryLevel(Integer menuCategoryLevel, Sort sort);
    Optional<MenuCategory> findByMenuCategoryName(String menuCategoryName);
    List<MenuCategory> findByMenuCategoryLevelOrderByMenuCategoryNameAsc(int level);

    /** ✅ 세트메뉴 + 레벨3 카테고리만 조회 (단품메뉴, 메뉴는 제외) */
    @Query("""
        SELECT c
        FROM MenuCategory c
        WHERE 
            (c.menuCategoryLevel = 3 OR c.menuCategoryName = '세트메뉴')
            AND c.menuCategoryName NOT IN ('단품메뉴', '메뉴')
        ORDER BY 
            CASE WHEN c.menuCategoryName = '세트메뉴' THEN 0 ELSE 1 END,
            c.menuCategoryName ASC
    """)
    List<MenuCategory> findSetAndLevel3Categories();
}

