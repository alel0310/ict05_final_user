package com.boot.ict05_final_user.domain.menu.repository;

import com.boot.ict05_final_user.domain.menu.dto.MenuListDTO;
import com.boot.ict05_final_user.domain.menu.dto.MenuSearchDTO;
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
        QMenuRecipe recipe = QMenuRecipe.menuRecipe;
        QMaterial material = QMaterial.material;

        // WHERE 조건
        BooleanExpression where = andAll(
                eqNameOrInfo(dto, menu),
                eqCategory(dto, menu),
                eqShow(dto, menu)
        );

        // 정렬 (기본: menuId DESC)
        Sort sort = (pageable.getSort().isSorted())
                ? pageable.getSort()
                : Sort.by(Sort.Direction.DESC, "menuId");

        // 1) 페이지 대상 ID만 먼저 조회
        List<Long> pageIds = queryFactory
                .select(menu.menuId)
                .from(menu)
                .leftJoin(menu.menuCategory, category) // 카테고리 정렬/필터 시 필요
                .where(where)
                .orderBy(toOrderSpec(menu, sort))
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        log.info("[listMenu] pageIds size={}, ids={}", pageIds.size(), pageIds);

        if (pageIds.isEmpty()) {
            log.info("[listMenu] pageIds empty -> return empty page");            // ★ 추가
            return new PageImpl<>(List.of(), pageable, 0);
        }

        // 2) 상세 + 재료 일괄 조회 (선택된 ID 한정)
        var rows = queryFactory
                .select(Projections.tuple(
                        menu.menuId,
                        menu.menuShow,
                        menu.menuName,
                        menu.menuCode,
                        category.menuCategoryId,
                        category.menuCategoryName,
                        menu.menuPrice,
                        menu.menuKcal,
                        material.name
                ))
                .from(menu)
                .leftJoin(menu.menuCategory, category)
                .leftJoin(menu.recipe, recipe)
                .leftJoin(recipe.material, material)
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
                d.setMenuShow(t.get(menu.menuShow));
                d.setMenuName(t.get(menu.menuName));
                d.setMenuCode(t.get(menu.menuCode));
                d.setMenuCategoryId(t.get(category.menuCategoryId));
                d.setMenuCategoryName(t.get(category.menuCategoryName));
                d.setMenuPrice(t.get(menu.menuPrice));
                d.setMenuKcal(t.get(menu.menuKcal));
                d.setMaterialNames(new ArrayList<>());
                return d;
            });
            String mName = t.get(material.name);
            if (mName != null) v.getMaterialNames().add(mName);
        }
        List<MenuListDTO> content = new ArrayList<>(map.values());

        // 3) Count (가벼운 버전: 불필요 조인 제거)
        Long total = queryFactory
                .select(menu.menuId.countDistinct())
                .from(menu)
                .where(where)
                .fetchOne();

        return new PageImpl<>(content, pageable, total != null ? total : 0L);
    }

    // ====== 아래는 헬퍼 메서드들 (클래스 안에 위치해야 함) ======

//    /** 이름 또는 설명 검색 */
//    private BooleanExpression eqNameOrInfo(MenuSearchDTO dto, QMenu menu) {
//        String kw = dto.getS();
//        if (!StringUtils.hasText(kw)) return null;
//
//        String type = Optional.ofNullable(dto.getType()).orElse("all");
//        return switch (type) {
//            case "name" -> menu.menuName.containsIgnoreCase(kw);
//            //case "info" -> menu.menuInformation.containsIgnoreCase(kw); // 필드명 확인
//            default -> menu.menuName.containsIgnoreCase(kw);
//                    //.or(menu.menuInformation.containsIgnoreCase(kw));    // 필드명 확인
//        };
//    }

//    /** 카테고리 필터 */
//    private BooleanExpression eqCategory(MenuSearchDTO dto, QMenu menu) {
//        if (dto.getMenuCategoryId() == null || dto.getMenuCategoryId() == 0) return null;
//        return menu.menuCategory.menuCategoryId.eq(dto.getMenuCategoryId());
//    }

//    /** 판매상태 필터 */
//    private BooleanExpression eqShow(MenuSearchDTO dto, QMenu menu) {
//        if (dto.getMenuShow() == null) return null;
//        return menu.menuShow.eq(dto.getMenuShow());
//    }

//    /** 여러 조건 and 결합 */
//    private BooleanExpression andAll(BooleanExpression... exps) {
//        BooleanExpression result = null;
//        for (BooleanExpression exp : exps) {
//            if (exp == null) continue;
//            result = (result == null) ? exp : result.and(exp);
//        }
//        return result;
//    }

//    // 정렬 변환 (pageable Sort → QueryDSL OrderSpecifier[])
//    private com.querydsl.core.types.OrderSpecifier<?>[] toOrderSpec(QMenu menu, Sort sort) {
//        return sort.stream()
//                .map(order -> {
//                    com.querydsl.core.types.Order direction = order.isAscending()
//                            ? com.querydsl.core.types.Order.ASC
//                            : com.querydsl.core.types.Order.DESC;
//                    return switch (order.getProperty()) {
//                        case "menuId"   -> new com.querydsl.core.types.OrderSpecifier<>(direction, menu.menuId);
//                        case "menuName" -> new com.querydsl.core.types.OrderSpecifier<>(direction, menu.menuName);
//                        case "menuPrice"-> new com.querydsl.core.types.OrderSpecifier<>(direction, menu.menuPrice);
//                        case "menuKcal" -> new com.querydsl.core.types.OrderSpecifier<>(direction, menu.menuKcal);
//                        default         -> new com.querydsl.core.types.OrderSpecifier<>(com.querydsl.core.types.Order.DESC, menu.menuId);
//                    };
//                })
//                .toArray(com.querydsl.core.types.OrderSpecifier[]::new);
//    }
}
