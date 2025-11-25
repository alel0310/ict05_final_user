# 메뉴 관리 기능 명세서 (`menu.md`)

이 문서는 메뉴 관리 기능의 프론트엔드와 백엔드 연동 구조를 기술합니다.

## 1. 메뉴 목록 조회 (페이징, 검색, 필터링)

가맹점주가 자신의 가게에 등록된 메뉴 목록을 조회하고, 이름으로 검색하거나 카테고리/판매상태로 필터링하는 기능입니다.

### ➡️ Frontend

-   **컴포넌트**: `front-end/src/components/Store/MenuManagement.tsx`
-   **핵심 함수**: `fetchMenus()`
-   **API 호출**:
    -   `GET /API/menu/list`
-   **요청 파라미터**:
    -   `page`: 페이지 번호 (0-based)
    -   `size`: 페이지 당 항목 수
    -   `s`: 검색어 (메뉴명)
    -   `type`: 검색 타입 (`name`으로 고정)
    -   `categoryName`: 카테고리명 (예: "토스트", "음료")
    -   `storeMenuSoldout`: 판매 상태 (`ON_SALE` 또는 `SOLD_OUT`)

### ⬅️ Backend

-   **Controller**: `src/.../domain/menu/controller/MenuRestController.java`
    -   **Method**: `getMenuList(MenuSearchDTO searchDTO, Pageable pageable, @AuthenticationPrincipal UserDetailsImpl userDetails)`
    -   **역할**: HTTP 요청을 받아 `MenuSearchDTO`와 `Pageable` 객체로 변환하고, 현재 로그인된 사용자의 `storeId`를 추출하여 서비스에 전달합니다.
-   **Service**: `src/.../domain/menu/service/MenuService.java`
    -   **Method**: `selectAllStoreMenu(MenuSearchDTO searchDTO, Pageable pageable, Long storeId)`
    -   **역할**: 전달받은 조건과 `storeId`를 사용하여 데이터베이스에서 메뉴 목록을 조회하는 로직을 수행합니다.
-   **Repository**: `src/.../domain/menu/repository/MenuRepositoryImpl.java`
    -   **Method**: `listMenu(MenuSearchDTO searchDTO, Pageable pageable, Long storeId)`
    -   **역할**: QueryDSL을 사용하여 동적 쿼리(검색, 필터링)를 생성하고, 데이터베이스에서 메뉴 목록과 페이징 데이터를 조회합니다. 가맹점별 품절 상태(`StoreMenu`)와 메뉴 기본 정보(`Menu`)를 조인하여 결과를 반환합니다.

---

## 2. 메뉴 상세 정보 조회

메뉴 목록에서 특정 메뉴를 클릭했을 때, 해당 메뉴의 상세 정보(기본 정보, 레시피 등)를 모달창으로 확인하는 기능입니다.

### ➡️ Frontend

-   **컴포넌트**: `front-end/src/components/Store/MenuManagement.tsx`
-   **핵심 함수**: `handleMenuDetail(menu)`
-   **API 호출**:
    -   `GET /API/menu/{menuId}`

### ⬅️ Backend

-   **Controller**: `src/.../domain/menu/controller/MenuRestController.java`
    -   **Method**: `getMenuDetail(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl userDetails)`
    -   **역할**: `menuId`와 로그인된 사용자의 `storeId`를 서비스에 전달합니다.
-   **Service**: `src/.../domain/menu/service/MenuService.java`
    -   **Method**: `selectStoreMenuDetail(Long menuId, Long storeId)`
    -   **역할**: `menuId`와 `storeId`를 사용하여 메뉴 상세 정보와 레시피 정보를 조회합니다.
-   **Repository**: `src/.../domain/menu/repository/MenuRepositoryImpl.java`
    -   **Method**: `getMenuDetail(Long menuId, Long storeId)`
    -   **역할**: QueryDSL을 사용하여 특정 메뉴의 상세 정보와 관련 레시피(`Recipe`) 목록을 조인하여 조회합니다.

---

## 3. 메뉴 품절 상태 변경

가맹점주가 특정 메뉴의 판매 상태를 '판매중' 또는 '품절'로 변경하는 기능입니다.

### ➡️ Frontend

-   **컴포넌트**: `front-end/src/components/Store/MenuManagement.tsx`
-   **핵심 함수**:
    -   `updateSoldOutOnServer(menuId, status)`: 실제 서버 API를 호출하는 함수
    -   `handleToggleStatus(...)`: 품절/판매중 토글 스위치 이벤트 핸들러
    -   `handleSoldOut(...)` / `handleRestock(...)`: 품절/재입고 버튼 클릭 이벤트 핸들러
-   **API 호출**:
    -   `PATCH /API/menu/{menuId}/sold-out`
-   **요청 Body**:
    -   `{ "storeMenuSoldout": "SOLD_OUT" }` 또는 `{ "storeMenuSoldout": "ON_SALE" }`

### ⬅️ Backend

-   **Controller**: `src/.../domain/menu/controller/MenuRestController.java`
    -   **Method**: `updateSoldOutStatus(@PathVariable Long menuId, @RequestBody SoldOutStatusUpdateRequestDTO requestDTO, @AuthenticationPrincipal UserDetailsImpl userDetails)`
    -   **역할**: `menuId`, 변경할 상태(`requestDTO`), `storeId`를 서비스에 전달합니다.
-   **Service**: `src/.../domain/menu/service/MenuService.java`
    -   **Method**: `updateSoldOutStatus(Long menuId, Long storeId, SoldOutStatus soldOutStatus)`
    -   **역할**:
        1.  `StoreMenuRepository`를 사용하여 `storeId`와 `menuId`로 기존 `StoreMenu` 엔티티를 조회합니다.
        2.  엔티티가 존재하면, 전달받은 `soldOutStatus`로 상태를 업데이트합니다.
        3.  엔티티가 없으면(해당 가맹점에서 처음 상태를 변경하는 경우), 새로운 `StoreMenu` 엔티티를 생성하고 상태를 설정하여 저장합니다. (Upsert 로직)
-   **Repository**: `com.boot.ict05_final_user.domain.storemenu.repository.StoreMenuRepository` (JPA Repository)
    -   **Method**: `findByStore_IdAndMenu_Id(storeId, menuId)` 및 `save(storeMenu)`
    -   **역할**: `StoreMenu` 테이블에 대한 조회 및 저장/수정(Upsert)을 담당합니다.
