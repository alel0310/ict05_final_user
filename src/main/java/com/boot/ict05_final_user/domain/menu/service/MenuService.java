package com.boot.ict05_final_user.domain.menu.service;

import com.boot.ict05_final_user.domain.menu.dto.MenuDetailDTO;
import com.boot.ict05_final_user.domain.menu.dto.MenuListDTO;
import com.boot.ict05_final_user.domain.menu.dto.MenuSearchDTO;
import com.boot.ict05_final_user.domain.menu.entity.Menu;
import com.boot.ict05_final_user.domain.menu.entity.StoreMenu;
import com.boot.ict05_final_user.domain.menu.entity.StoreMenuSoldout;
import com.boot.ict05_final_user.domain.menu.repository.MenuCategoryRepository;
import com.boot.ict05_final_user.domain.menu.repository.MenuRecipeRepository;
import com.boot.ict05_final_user.domain.menu.repository.MenuRepository;
import com.boot.ict05_final_user.domain.menu.repository.StoreMenuRepository;
import com.boot.ict05_final_user.domain.store.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 메뉴 관련 비즈니스 로직을 처리하는 서비스 클래스
 *
 * <p>메뉴 등록, 수정, 조회 등의 기능을 제공한다.</p>
 */
@Service
@RequiredArgsConstructor
@Transactional      // DB 작업은 하나의 트랜잭션 단위로 처리 - 중간에 에러 나면 모두 취소
@Slf4j  // 로그를 찍을 수 있음
public class MenuService {

    private final MenuRepository menuRepository;    // @RequiredArgsConstructor가 자동으로 주입해 줘서 @Autowired가 필요 없음
    private final StoreMenuRepository storeMenuRepository;
    private final StoreRepository storeRepository;

    /**
     * 메뉴 목록을 페이지 단위로 조회한다.
     *
     * @param menuSearchDTO
     * @param pageable      페이지 정보 (페이지 번호, 크기, 정렬)
     * @return 페이징 처리된 메뉴 리스트 DTO
     */
    public Page<MenuListDTO> selectAllStoreMenu(MenuSearchDTO menuSearchDTO, Pageable pageable) {
        var menus = menuRepository.listMenu(menuSearchDTO, pageable);

        // 디버깅 로그 추가
        log.info("rows={}", menus.getNumberOfElements());
        menus.getContent().forEach(m ->
                log.info("id={}, name={}", m.getMenuId(), m.getMenuName())
        );

        return menus;
    }

    /**
     * 메뉴 상세 정보를 조회한다.
     *
     * @param menuId 메뉴 ID
     * @return 메뉴 엔티티, 존재하지 않으면 null
     */
    public MenuDetailDTO selectStoreMenuDetail(Long menuId) {
        return menuRepository.getMenuDetail(menuId);
    }


    /** 메뉴 품절처리 */
    public void updateSoldOutStatus(Long storeId, Long menuId, StoreMenuSoldout status) {
        StoreMenu storeMenu = storeMenuRepository
                .findByStoreIdAndMenuId(storeId, menuId)
                .orElseGet(() -> {
                    var store = storeRepository.findById(storeId)
                            .orElseThrow(() -> new IllegalArgumentException("store not found: " + storeId));
                    var menu = menuRepository.findById(menuId)
                            .orElseThrow(() -> new IllegalArgumentException("menu not found: " + menuId));

                    StoreMenu sm = new StoreMenu();
                    sm.setStore(store);
                    sm.setMenu(menu);
                    sm.setStoreMenuSoldout(StoreMenuSoldout.ON_SALE); // 기본값
                    return storeMenuRepository.save(sm);
                });

        storeMenu.setStoreMenuSoldout(status);  // JPA dirty checking
    }
}



