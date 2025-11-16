package com.boot.ict05_final_user.domain.menu.controller;


import com.boot.ict05_final_user.domain.menu.dto.*;
import com.boot.ict05_final_user.domain.menu.entity.StoreMenuSoldout;
import com.boot.ict05_final_user.domain.menu.repository.MenuCategoryRepository;
import com.boot.ict05_final_user.domain.menu.repository.MenuRepository;
import com.boot.ict05_final_user.domain.menu.service.MenuService;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequiredArgsConstructor
@RequestMapping("/API")
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
public class MenuRestController {

    private final MenuService menuService;
    private final MenuRepository menuRepository;
    private final MenuCategoryRepository menuCategoryRepository;

    /** 메뉴 목록 API */
    @GetMapping("/menu/list")
    public Page<MenuListDTO> getMenuList(
            MenuSearchDTO menuSearchDTO,
            @PageableDefault(page = 0, size = 10, sort = "menuId", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        return menuService.selectAllStoreMenu(menuSearchDTO, pageable);
    }

    /** 메뉴 상세 API */
    @GetMapping("/menu/{id}")
    public ResponseEntity<MenuDetailDTO> getMenuDetail(@PathVariable Long id) {
        MenuDetailDTO dto = menuService.selectStoreMenuDetail(id);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @Getter
    @Setter
    public static class SoldOutUpdateRequest {
        private StoreMenuSoldout storeMenuSoldout;
    }

    @PatchMapping("/stores/{storeId}/menus/{menuId}/sold-out")
    public ResponseEntity<Void> updateSoldOutStatus(
            @PathVariable Long storeId,
            @PathVariable Long menuId,
            @RequestBody SoldOutUpdateRequest request
    ) {
        menuService.updateSoldOutStatus(storeId, menuId, request.getStoreMenuSoldout());
        return ResponseEntity.noContent().build();
    }


}
