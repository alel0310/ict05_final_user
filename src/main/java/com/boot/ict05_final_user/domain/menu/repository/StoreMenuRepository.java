package com.boot.ict05_final_user.domain.menu.repository;

import com.boot.ict05_final_user.domain.menu.entity.StoreMenu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoreMenuRepository extends JpaRepository<StoreMenu, Long> {

    // 가맹점 + 메뉴로 한 건 찾기 (품절 토글 등에 사용)
    Optional<StoreMenu> findByStore_StoreIdAndMenu_MenuId(Long storeId, Long menuId);

    // 특정 가맹점의 전체 메뉴
    List<StoreMenu> findByStore_StoreId(Long storeId);
}
