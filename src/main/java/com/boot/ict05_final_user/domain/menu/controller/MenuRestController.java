package com.boot.ict05_final_user.domain.menu.controller;


import com.boot.ict05_final_user.domain.menu.dto.*;
import com.boot.ict05_final_user.domain.menu.entity.Menu;
import com.boot.ict05_final_user.domain.menu.entity.MenuCategory;
import com.boot.ict05_final_user.domain.menu.entity.MenuShow;
import com.boot.ict05_final_user.domain.menu.entity.SoldOutStatus;
import com.boot.ict05_final_user.domain.menu.repository.MenuCategoryRepository;
import com.boot.ict05_final_user.domain.menu.repository.MenuRepository;
import com.boot.ict05_final_user.domain.menu.service.MenuService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 메뉴 관련 REST API 컨트롤러
 *
 * <p>이 컨트롤러는 다음과 같은 기능을 제공합니다:</p>
 * <ul>
 *     <li>메뉴 등록</li>
 *     <li>메뉴 수정</li>
 * </ul>
 *
 * <p>
 * {@link MenuWriteFormDTO}, {@link MenuModifyFormDTO} 를 통해
 * 검증 및 데이터 바인딩을 수행합니다.</p>
 *
 * @author 채은
 * @since 2025.10.21
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/API")
@Tag(name= "메뉴 API", description = "메뉴 등록/조회/수정 기능 제공")
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
        private SoldOutStatus soldOutStatus;
    }

    /** 품절 상태 변경 API */
    @PatchMapping("/menu/{id}/sold-out")
    public ResponseEntity<Void> updateSoldOutStatus(
            @PathVariable Long id,
            @RequestBody SoldOutUpdateRequest request
    ) {
        menuService.updateSoldOutStatus(id, request.getSoldOutStatus());
        return ResponseEntity.noContent().build();
    }
    /**
     * 매뉴 등록 API
     *
     * <p>본사에서 새로운 메뉴 등록하는 엔드포인트입니다.
     *  메뉴 데이터를 저장합니다.</p>
     *
     * @param dto 등록할 메뉴 데이터 (제목, 내용, 카테고리 포함)
     * @param bindingResult 유효성 검증 결과
     * @return 등록 성공 여부 및 생성된 메뉴 ID
     * @throws Exception DB 저장 오류
     */
    @PostMapping("/menu/add")
    public ResponseEntity<Long> createMenu(@RequestBody MenuWriteFormDTO dto) {

        MenuCategory category = menuCategoryRepository.findById(dto.getMenuCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("잘못된 카테고리"));

        Menu menu = Menu.builder()
                .menuName(dto.getMenuName())
                .menuNameEnglish(dto.getMenuNameEnglish())
                .menuCode(dto.getMenuCode())
                .menuKcal(dto.getMenuKcal() != null ? dto.getMenuKcal() : 0)
                .menuInformation(dto.getMenuInformation())
                .menuPrice(dto.getMenuPrice())
                .menuShow(MenuShow.SHOW)
                .soldOutStatus(SoldOutStatus.ON_SALE)
                .menuCategory(category)
                .ingredients(dto.getIngredients())
                .build();

        menuRepository.save(menu);

        return ResponseEntity.ok(menu.getMenuId());
    }

//
//    @PostMapping("/menu/modify/{menuId}")   // 여기엔 /API 다시 쓰지 않음
//    public Map<String,Object> modify(@PathVariable Long menuId,
//                                     @ModelAttribute MenuModifyFormDTO dto) {
//        dto.setMenuId(menuId);
//        menuService.menuModify(dto);
//        return Map.of("success", true, "id", menuId);
//    }

}
