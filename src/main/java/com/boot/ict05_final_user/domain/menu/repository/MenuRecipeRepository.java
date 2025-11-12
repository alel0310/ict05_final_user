package com.boot.ict05_final_user.domain.menu.repository;

import com.boot.ict05_final_user.domain.menu.entity.Menu;
import com.boot.ict05_final_user.domain.menu.entity.MenuRecipe;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MenuRecipeRepository extends JpaRepository<MenuRecipe, Long> {
    void deleteAllByMenu(Menu menu);
}
