package com.boot.ict05_final_user.domain.menu.controller;

import com.boot.ict05_final_user.domain.menu.dto.MenuListDTO;
import com.boot.ict05_final_user.domain.menu.dto.MenuSearchDTO;
import com.boot.ict05_final_user.domain.menu.entity.MenuCategory;
import com.boot.ict05_final_user.domain.menu.repository.MenuCategoryRepository;
import com.boot.ict05_final_user.domain.menu.service.MenuService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;


/**
 * 본사 메뉴 관리 컨트롤러
 * <p>
 * 메뉴 작성, 메뉴 목록 조회, 상세 조회, 수정 화면을 제공한다.
 * 카테고리, 첨부파일 기능을 지원한다.
 */
@Controller
@RequiredArgsConstructor    // 생성자
public class MenuController {

    private final MenuService menuService;      // private final : 바꿀 수 없는 변수
    private final MenuCategoryRepository menuCategoryRepository;
    // private final MaterialRepository materialRepository;

//    /**
//     * 메뉴 목록을 페이징 처리하여 조회한다.
//     *
//     * @param menuSearchDTO 메뉴 이름으로 검색할 경우 전달되는 값
//     * @param pageable 페이지 번호, 크기, 정렬 조건을 포함한 페이징 객체
//     * @param model    뷰에 전달할 모델 객체
//     * @return 메뉴 목록 페이지 뷰 이름
//     */
//    @GetMapping("/menu/list")
//    public String listStoreMenu(
//            MenuSearchDTO menuSearchDTO,
//            @PageableDefault(page = 1, size = 10, sort = "menuId", direction = Sort.Direction.DESC) Pageable pageable,
//            Model model,
//            HttpServletRequest request) {
//
//        int size = resolveSize(menuSearchDTO.getSize(), pageable.getPageSize());
//        Sort sort = pageable.getSort().isSorted()
//                ? pageable.getSort()
//                : Sort.by(Sort.Direction.DESC, "menuId");
//
//        PageRequest pageRequest = PageRequest.of(pageable.getPageNumber()-1, size, sort);
//
//        Page<MenuListDTO> menus = menuService.selectAllStoreMenu(menuSearchDTO, pageRequest);
//
//        // 카테고리: 리프(레벨3)만 + "세트메뉴" 하나 추가
//        List<MenuCategory> categories = new ArrayList<>(
//                menuCategoryRepository.findAllByMenuCategoryLevel(3, Sort.by("menuCategoryName").ascending())
//        );
//        List<MenuCategory> finalCategories = categories;
//        menuCategoryRepository.findByMenuCategoryName("세트메뉴")
//                .ifPresent(c -> finalCategories.add(0, c));
//
//        // 혹시라도 중복 방지 (같은 ID가 들어갈 가능성 대비)
//        categories = categories.stream()
//                .collect(java.util.stream.Collectors.collectingAndThen(
//                        java.util.stream.Collectors.toMap(
//                                MenuCategory::getMenuCategoryId,
//                                c -> c,
//                                (a, b) -> a,
//                                LinkedHashMap::new
//                        ),
//                        m -> new ArrayList<>(m.values())
//                ));
//
//        model.addAttribute("menus", menus);
//        model.addAttribute("menuSearchDTO", menuSearchDTO);
//        model.addAttribute("menuCategories", categories);
//        model.addAttribute("urlBuilder", ServletUriComponentsBuilder.fromRequest(request));
//
//        return "menu/list";
//    }
//
//    // util
//    private int resolveSize(String s, int fallback) {
//        try {
//            if (s == null || s.isBlank()) return fallback;
//            int v = Integer.parseInt(s);
//            return (v < 1) ? fallback : v;
//        } catch (NumberFormatException e) {
//            return fallback;
//        }
//    }

//    /**
//     * 메뉴 작성 화면을 표시한다.
//     *
//     * @param model 뷰에 전달할 모델 객체
//     * @return 메뉴 작성 페이지 뷰 이름
//     */
//    @GetMapping("/menu/write")
//    public String writeForm(Model model) {
//
//        MenuWriteFormDTO form = new MenuWriteFormDTO();
//        form.setMenuShow(MenuShow.SHOW);
//
//        model.addAttribute("menuWriteFormDTO", form);   // 템플릿의 th:object와 맞춤
//        model.addAttribute("menuShowValues", MenuShow.values()); // 라디오 반복용
//
//        // model.addAttribute("units", List.of("g", "ml", "개", "장"));
//        model.addAttribute("units", RecipeUnit.values());
//
//        List<MenuCategory> categories = menuCategoryRepository.findSetAndLevel3Categories();
//        model.addAttribute("menuCategories", categories); // 셀렉트 옵션용
//
//        // 재료 옵션 (레포 수정 없이)
//        List<Material> mainEntities  = materialRepository.findByCategory(MaterialCategory.BASE);
//        List<Material> sauceEntities = materialRepository.findByCategory(MaterialCategory.SAUCE);
//
//        List<MaterialSimpleDTO> mainOptions = mainEntities.stream()
//                .map(m -> new MaterialSimpleDTO(m.getId(), m.getName()))
//                .toList();
//        List<MaterialSimpleDTO> sauceOptions = sauceEntities.stream()
//                .map(m -> new MaterialSimpleDTO(m.getId(), m.getName()))
//                .toList();
//
//        model.addAttribute("mainOptions", mainOptions);
//        model.addAttribute("sauceOptions", sauceOptions);
//
//        return "menu/write";
//    }

//    @PostMapping("/menu/write")
//    public String submitMenuWrite(@Validated @ModelAttribute("menuWriteFormDTO") MenuWriteFormDTO dto,
//                                  BindingResult bindingResult,
//                                  RedirectAttributes ra) {
//        // 리스트 null 방지
//        if (dto.getMainMaterials() == null) dto.setMainMaterials(new ArrayList<>());
//        if (dto.getSauceMaterials() == null) dto.setSauceMaterials(new ArrayList<>());
//
//        if (bindingResult.hasErrors()) {
//            return "menu/write";
//        }
//
//        Long menuId = menuService.insertStoreMenu(dto);
//        ra.addFlashAttribute("message", "메뉴가 저장되었습니다.");
//        return "redirect:/menu/detail/" + menuId; // context-path가 /admin이면 실제 호출은 /admin/menu/detail/{id}
//    }


//    /**
//     * 특정 메뉴 상세 내용을 조회한다.
//     *
//     * @param menuId    메뉴 ID
//     * @param model 뷰에 전달할 모델 객체
//     * @return 메뉴 상세 페이지 뷰 이름
//     */
//    @GetMapping("/menu/detail/{menuId}")
//    public String detailStoreMenu(@PathVariable Long menuId, Model model) {
//        MenuDetailDTO menu = menuService.MenuDetail(menuId);
//
//        model.addAttribute("menu", menu);
//
//        return "menu/detail";
//    }

//    /**
//     * 특정 메뉴의 수정 화면을 표시한다.
//     *
//     * @param menuId    메뉴 ID
//     * @param model 뷰에 전달할 모델 객체
//     * @return 메뉴 수정 페이지 뷰 이름
//     */
//    @GetMapping("/menu/modify/{menuId}")
//    public String modifyStoreMenu(@PathVariable Long menuId, Model model) {
//        // 1) 상세 조회
//        MenuDetailDTO menu = menuService.MenuDetail(menuId);
//
//        // 2) 상세 -> 폼 DTO
//        MenuModifyFormDTO form = MenuModifyFormDTO.builder()
//                .menuId(menu.getMenuId())
//                .menuCategoryId(menu.getMenuCategory().getMenuCategoryId())
//                .menuShow(menu.getMenuShow())
//                .menuCode(menu.getMenuCode())
//                .menuName(menu.getMenuName())
//                .menuNameEnglish(menu.getMenuNameEnglish())
//                .menuPrice(menu.getMenuPrice())
//                .menuInformation(menu.getMenuInformation())
//                .menuKcal(menu.getMenuKcal())
//                .mainMaterials(menu.getMainMaterials())
//                .sauceMaterials(menu.getSauceMaterials())
//                .build();
//
//        if (form.getMenuShow() == null) {
//            form.setMenuShow(MenuShow.SHOW);
//        }
//
//        // 카테고리 그대로
//        List<MenuCategory> categories = menuCategoryRepository.findAll(Sort.by("menuCategoryName").ascending());
//
//        // 주재료 옵션
//        List<MaterialSimpleDTO> mainOptions = materialRepository.findByCategory(MaterialCategory.BASE)
//                .stream()
//                .map(m -> new MaterialSimpleDTO(m.getId(), m.getName()))
//                .toList();
//
//        // 소스 옵션 (예: SAUCE)
//        List<MaterialSimpleDTO> sauceOptions = materialRepository.findByCategory(MaterialCategory.SAUCE)
//                .stream()
//                .map(m -> new MaterialSimpleDTO(m.getId(), m.getName()))
//                .toList();
//
//        model.addAttribute("menuModifyFormDTO", form);
//        model.addAttribute("menuCategories", categories);
//        model.addAttribute("menuShowValues", MenuShow.values());
//        model.addAttribute("mainOptions", mainOptions);
//        model.addAttribute("sauceOptions", sauceOptions);
//        model.addAttribute("units", RecipeUnit.values());
//
//        return "menu/modify";
//    }


}
