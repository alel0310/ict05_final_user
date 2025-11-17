package com.boot.ict05_final_user.domain.menu.repository;

import com.boot.ict05_final_user.domain.menu.dto.MenuDetailDTO;
import com.boot.ict05_final_user.domain.menu.dto.MenuListDTO;
import com.boot.ict05_final_user.domain.menu.dto.MenuSearchDTO;
import com.boot.ict05_final_user.domain.menu.entity.MenuShow;
import com.boot.ict05_final_user.domain.menu.entity.QMenu;
import com.boot.ict05_final_user.domain.menu.entity.QMenuCategory;
import com.boot.ict05_final_user.domain.menu.entity.QMenuRecipe;
import com.boot.ict05_final_user.domain.menu.entity.QStoreMenu;
import com.boot.ict05_final_user.domain.inventory.entity.QMaterial;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.util.*;

@Slf4j
@Repository
@RequiredArgsConstructor
public class MenuRepositoryImpl implements MenuRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Page<MenuListDTO> listMenu(MenuSearchDTO dto, Pageable pageable) {
        if (dto == null) dto = new MenuSearchDTO();

        QMenu menu = QMenu.menu;
        QMenuCategory category = QMenuCategory.menuCategory;
        QStoreMenu storeMenu = QStoreMenu.storeMenu;

        // WHERE 조건 (menu 기준)
        BooleanExpression where = andAll(
                eqNameOrInfo(dto, menu),
                eqCategory(dto, menu)
                // 품절 필터는 나중에 storeMenuSoldout 필요하면 추가
        );

        // 본사 메뉴 쇼 상태: 기본 SHOW만
        if (dto.getMenuShow() != null) {
            where = andAll(where, menu.menuShow.eq(dto.getMenuShow()));
        } else {
            where = andAll(where, menu.menuShow.eq(MenuShow.SHOW));
        }

        // 정렬 (기본: menuId DESC)
        Sort sort = (pageable.getSort().isSorted())
                ? pageable.getSort()
                : Sort.by(Sort.Direction.DESC, "menuId");

        // 1) 페이지 대상 menuId만 먼저 조회 (menu 기준)
        List<Long> pageIds = queryFactory
                .select(menu.menuId)
                .from(menu)
                .leftJoin(menu.menuCategory, category)
                .where(where)
                .orderBy(toOrderSpec(menu, sort))
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        log.info("[listMenu] pageIds size={}, ids={}", pageIds.size(), pageIds);

        if (pageIds.isEmpty()) {
            log.info("[listMenu] pageIds empty -> return empty page");
            return new PageImpl<>(List.of(), pageable, 0);
        }

        // 2) 메뉴 + 가맹점별 상태 조회 (menu 기준 + LEFT JOIN store_menu)
        var rows = queryFactory
                .select(Projections.tuple(
                        menu.menuId,
                        menu.menuName,
                        menu.menuNameEnglish,
                        category.menuCategoryId,
                        category.menuCategoryName,
                        menu.menuPrice,
                        menu.menuKcal,
                        menu.menuInformation,
                        menu.menuCode,
                        storeMenu.storeMenuSoldout,   // 가맹점별 품절 (nullable)
                        menu.menuShow
                ))
                .from(menu)
                .leftJoin(menu.menuCategory, category)
                .leftJoin(storeMenu).on(storeMenu.menu.eq(menu))
                .where(menu.menuId.in(pageIds))
                .orderBy(toOrderSpec(menu, sort))
                .fetch();

        log.info("[listMenu] rows fetched={}", rows.size());

        Map<Long, MenuListDTO> map = new LinkedHashMap<>();
        for (var t : rows) {
            Long id = t.get(menu.menuId);
            MenuListDTO v = map.computeIfAbsent(id, k -> {
                MenuListDTO d = new MenuListDTO();
                d.setMenuId(t.get(menu.menuId));
                d.setMenuName(t.get(menu.menuName));
                d.setMenuNameEnglish(t.get(menu.menuNameEnglish));
                d.setMenuCategoryId(t.get(category.menuCategoryId));
                d.setMenuCategoryName(t.get(category.menuCategoryName));
                d.setMenuPrice(t.get(menu.menuPrice));
                d.setMenuKcal(t.get(menu.menuKcal));
                d.setMenuInformation(t.get(menu.menuInformation));
                d.setMenuCode(t.get(menu.menuCode));
                d.setStoreMenuSoldout(t.get(storeMenu.storeMenuSoldout)); // null 가능
                d.setMenuShow(t.get(menu.menuShow));
                return d;
            });
        }
        List<MenuListDTO> content = new ArrayList<>(map.values());

        // 3) Count (menu 기준)
        Long total = queryFactory
                .select(menu.menuId.count())
                .from(menu)
                .leftJoin(menu.menuCategory, category)
                .where(where)
                .fetchOne();

        return new PageImpl<>(content, pageable, total != null ? total : 0L);
    }



    // ====== 검색 조건 헬퍼들 ======

    /** 이름 검색 */
    private BooleanExpression eqNameOrInfo(MenuSearchDTO dto, QMenu menu) {
        String kw = dto.getS();
        if (!StringUtils.hasText(kw)) return null;

        String type = Optional.ofNullable(dto.getType()).orElse("all");
        return switch (type) {
            case "name" -> menu.menuName.containsIgnoreCase(kw);
            default -> menu.menuName.containsIgnoreCase(kw);
        };
    }

    /** 카테고리 필터 */
    private BooleanExpression eqCategory(MenuSearchDTO dto, QMenu menu) {
        if (dto.getMenuCategoryId() == null || dto.getMenuCategoryId() == 0) return null;
        return menu.menuCategory.menuCategoryId.eq(dto.getMenuCategoryId());
    }

    /** 품절상태 필터 – 이제 StoreMenu 기준 */
    private BooleanExpression eqSoldOutStatus(MenuSearchDTO dto, QStoreMenu storeMenu) {
        if (dto.getStoreMenuSoldout() == null) return null;
        return storeMenu.storeMenuSoldout.eq(dto.getStoreMenuSoldout());
    }

    /** 여러 조건 and 결합 */
    private BooleanExpression andAll(BooleanExpression... exps) {
        BooleanExpression result = null;
        for (BooleanExpression exp : exps) {
            if (exp == null) continue;
            result = (result == null) ? exp : result.and(exp);
        }
        return result;
    }

    // 정렬 변환 (pageable Sort → QueryDSL OrderSpecifier[])

    private com.querydsl.core.types.OrderSpecifier<?>[] toOrderSpec(QMenu menu, Sort sort) {
        return sort.stream()
                .map(order -> {
                    com.querydsl.core.types.Order direction = order.isAscending()
                            ? com.querydsl.core.types.Order.ASC
                            : com.querydsl.core.types.Order.DESC;
                    return switch (order.getProperty()) {
                        case "menuId" -> new com.querydsl.core.types.OrderSpecifier<>(direction, menu.menuId);
                        case "menuName" -> new com.querydsl.core.types.OrderSpecifier<>(direction, menu.menuName);
                        case "menuPrice" -> new com.querydsl.core.types.OrderSpecifier<>(direction, menu.menuPrice);
                        case "menuKcal" -> new com.querydsl.core.types.OrderSpecifier<>(direction, menu.menuKcal);
                        default ->
                                new com.querydsl.core.types.OrderSpecifier<>(com.querydsl.core.types.Order.DESC, menu.menuId);
                    };
                })
                .toArray(com.querydsl.core.types.OrderSpecifier[]::new);
    }

    // ====== 상세 조회 (재료 목록 중심) ======

    @Override
    public MenuDetailDTO getMenuDetail(Long menuId) {
        QMenu menu = QMenu.menu;
        QMenuCategory category = QMenuCategory.menuCategory;
        QMenuRecipe recipe = QMenuRecipe.menuRecipe;
        QMaterial material = QMaterial.material;

        var rows = queryFactory
                .select(Projections.tuple(
                        menu.menuId,
                        menu.menuName,
                        menu.menuNameEnglish,
                        category.menuCategoryId,
                        category.menuCategoryName,
                        menu.menuPrice,
                        menu.menuKcal,
                        menu.menuInformation,
                        menu.menuCode,
                        menu.menuShow,
                        material.name       // 🔹 레시피 재료 이름
                ))
                .from(menu)
                .leftJoin(menu.menuCategory, category)
                .leftJoin(menu.recipe, recipe)
                .leftJoin(recipe.material, material)
                .where(menu.menuId.eq(menuId))
                .fetch();

        log.info("[getMenuDetail] id={}, rows={}", menuId, rows.size());

        if (rows.isEmpty()) {
            return null;
        }

        var first = rows.get(0);

        MenuDetailDTO dto = new MenuDetailDTO();
        dto.setMenuId(first.get(menu.menuId));
        dto.setMenuName(first.get(menu.menuName));
        dto.setMenuNameEnglish(first.get(menu.menuNameEnglish));
        dto.setMenuCategoryId(first.get(category.menuCategoryId));
        dto.setMenuCategoryName(first.get(category.menuCategoryName));
        dto.setMenuPrice(first.get(menu.menuPrice));
        dto.setMenuKcal(first.get(menu.menuKcal));
        dto.setMenuInformation(first.get(menu.menuInformation));
        dto.setMenuCode(first.get(menu.menuCode));
        dto.setMenuShow(first.get(menu.menuShow));

        // 🔹 재료 이름 목록만 추출해서 DTO에 세팅
        Set<String> ingredientNames = new LinkedHashSet<>();
        for (var t : rows) {
            String name = t.get(material.name);
            if (name != null && !name.isBlank()) {
                ingredientNames.add(name);
            }
        }
        dto.setIngredientNames(new ArrayList<>(ingredientNames));

        return dto;
    }
}
