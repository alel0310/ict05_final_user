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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;


@RestController
@RequiredArgsConstructor
@RequestMapping("/API")
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
public class MenuRestController {

    private final MenuService menuService;

    /** 메뉴 목록 API (로그인 가맹점 기준 + 서버 페이징/검색/필터) */
    @GetMapping("/menu/list")
    public Page<MenuListDTO> getMenuList(
            MenuSearchDTO menuSearchDTO,
            @PageableDefault(page = 0, size = 10, sort = "menuId", direction = Sort.Direction.DESC)
            Pageable pageable,
            // 🔹 로그인한 사용자 객체에서 storeId 뽑기 (UserDetails에 storeId 필드가 있다고 가정)
            @AuthenticationPrincipal(expression = "storeId") Long storeId
    ) {
        if (storeId == null) {
            throw new IllegalStateException("로그인한 가맹점(storeId)을 찾을 수 없습니다.");
        }
        return menuService.selectAllStoreMenu(storeId, menuSearchDTO, pageable);
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

    /** 품절 상태 변경 (로그인 가맹점 기준) */
    @PatchMapping("/menu/{menuId}/sold-out")
    public ResponseEntity<Void> updateSoldOutStatus(
            @PathVariable Long menuId,
            @RequestBody SoldOutUpdateRequest request,
            @AuthenticationPrincipal(expression = "storeId") Long storeId
    ) {
        if (storeId == null) {
            throw new IllegalStateException("로그인한 가맹점(storeId)을 찾을 수 없습니다.");
        }
        menuService.updateSoldOutStatus(storeId, menuId, request.getStoreMenuSoldout());
        return ResponseEntity.noContent().build();
    }

}
