# 주문 관리 기능 명세서 (`order.md`)

이 문서는 주문 관리 기능의 프론트엔드와 백엔드 연동 구조를 기술합니다.

## 1. 주문 생성 (POS 시스템)

가맹점주가 POS 시스템에서 고객의 주문을 접수하고, 메뉴 선택, 할인 적용, 주문 유형 지정 후 결제를 처리하여 새로운 주문을 생성하는 기능입니다.

### ➡️ Frontend

-   **컴포넌트**: `front-end/src/components/Store/OrderSystem.tsx`
-   **핵심 함수**: `processPayment(method: string)`
-   **사전 API 호출 (메뉴 목록 조회)**:
    -   `GET /API/menu/list` (메뉴 관리 시스템에서 사용되는 것과 동일한 API)
    -   역할: 주문 가능한 메뉴 목록을 불러와 POS 화면에 표시합니다.
-   **주문 생성 API 호출**:
    -   `POST /api/customer-orders`
-   **요청 Body**:
    ```json
    {
      "orderCode": "string (자동 생성: #0001)",
      "orderType": "VISIT | TAKEOUT | DELIVERY",
      "paymentType": "CASH | CARD | VOUCHER",
      "totalPrice": "number",
      "discount": "number",
      "customerName": "string (선택)",
      "items": [
        {
          "menuId": "number",
          "quantity": "number",
          "unitPrice": "number"
        }
      ]
    }
    ```

### ⬅️ Backend

-   **Controller**: `src/.../domain/order/controller/CustomerOrderController.java`
    -   **Method**: `create(@AuthenticationPrincipal AppUser user, @RequestBody CreateOrderRequestDTO req, HttpServletRequest request)`
    -   **역할**: HTTP POST 요청을 받아 `CreateOrderRequestDTO`를 처리하고, 인증된 사용자(`AppUser`)로부터 `storeId`를 추출하여 서비스 계층에 전달합니다.
-   **Service**: `src/.../domain/order/service/CustomerOrderService.java`
    -   **Method**: `create(CreateOrderRequestDTO req, Long storeId)`
    -   **역할**:
        -   `storeRepository.findById(storeId)`를 통해 가맹점 엔티티를 조회합니다.
        -   `generateOrderCode()`를 호출하여 새로운 주문 코드를 생성합니다.
        -   `CustomerOrder` 엔티티를 생성하고 `orderRepository.save(order)`를 통해 저장합니다.
        -   `menuRepository.findById(menuId)`를 통해 각 주문 품목의 메뉴 엔티티를 조회합니다.
        -   `CustomerOrderDetail` 엔티티를 생성하고 `detailRepository.save(d)`를 통해 저장합니다.
-   **Repository**:
    -   `src/.../domain/order/repository/CustomerOrderRepository.java`
        -   **Method**: `save(CustomerOrder entity)`: 새로운 `CustomerOrder` 엔티티를 데이터베이스에 저장합니다.
        -   **Method**: `findTopByOrderByIdDesc()`: `generateOrderCode` 내부에서 사용되며, 가장 최근 주문의 ID를 조회합니다.
    -   `src/.../domain/order/repository/CustomerOrderDetailRepository.java`
        -   **Method**: `save(CustomerOrderDetail entity)`: 각 주문 품목 상세 엔티티를 데이터베이스에 저장합니다.
    -   `src/.../domain/store/repository/StoreRepository.java`
        -   **Method**: `findById(Long id)`: 가맹점 정보를 조회합니다.
    -   `src/.../domain/menu/repository/MenuRepository.java`
        -   **Method**: `findById(Long id)`: 메뉴 정보를 조회합니다.

---

## 2. 주문 목록 조회 (필터링, 검색, 페이징)

가맹점주가 등록된 주문 목록을 조회하고, 다양한 조건(키워드, 상태, 결제 수단, 주문 유형, 기간)으로 필터링/검색하며 페이지 단위로 확인할 수 있는 기능입니다.

### ➡️ Frontend

-   **컴포넌트**: `front-end/src/components/Store/OrderList.tsx`
-   **핵심 함수**: `fetchOrders()`
-   **API 호출**:
    -   `GET /api/customer-orders`
-   **요청 파라미터**:
    -   `page`: 페이지 번호 (0-based)
    -   `size`: 페이지 당 항목 수
    -   `keyword`: 검색어 (주문번호, 고객명, 전화번호, 메뉴명)
    -   `status`: 주문 상태 (`PENDING`, `PREPARING`, `COOKING`, `READY`, `COMPLETED`, `CANCELLED`)
    -   `paymentType`: 결제 수단 (`CARD`, `CASH`, `VOUCHER`)
    -   `orderType`: 주문 유형 (`VISIT`, `TAKEOUT`, `DELIVERY`)
    -   `period`: 조회 기간 프리셋 (`all`, `today`, `week`, `month`)

### ⬅️ Backend

-   **Controller**: `src/.../domain/order/controller/CustomerOrderController.java`
    -   **Method**: `listForStore(@AuthenticationPrincipal AppUser user, String keyword, String status, String paymentType, String orderType, String period, @ParameterObject Pageable pageable)`
    -   **역할**: HTTP GET 요청으로부터 쿼리 파라미터를 받아 `CustomerOrderSearchDTO` 및 `Pageable` 객체로 구성하고, 인증된 `storeId`와 함께 서비스 계층에 전달합니다.
-   **Service**: `src/.../domain/order/service/CustomerOrderService.java`
    -   **Method**: `searchOrderListPage(Long storeId, CustomerOrderSearchDTO cond, Pageable pageable)`
    -   **역할**: 전달받은 `storeId`와 검색 조건(`cond`, `pageable`)을 사용하여 리포지토리에서 주문 목록을 조회하고, `Page<CustomerOrderListDTO>` 형태로 변환하여 반환합니다.
-   **Repository**:
    -   `src/.../domain/order/repository/CustomerOrderRepository.java` (인터페이스)
        -   `extends CustomerOrderRepositoryCustom`: `searchOrders` 메서드 정의를 포함합니다.
    -   `src/.../domain/order/repository/CustomerOrderRepositoryImpl.java`
        -   **Method**: `searchOrders(Long storeId, CustomerOrderSearchDTO cond, Pageable pageable)`
        -   **역할**: QueryDSL을 사용하여 동적으로 SQL 쿼리를 생성합니다. `storeId`를 필수로 하며, `cond`의 `keyword`, `status`, `paymentType`, `orderType`, `period` 조건을 모두 적용하여 `CustomerOrder`와 `CustomerOrderDetail`, `Menu` 엔티티를 조인하여 필터링/검색/페이징된 결과를 반환합니다.

---

## 3. 주문 상세 조회

특정 주문의 상세 정보(주문 품목, 고객 정보, 결제 금액 등)를 조회하는 기능입니다.

### ➡️ Frontend

-   **컴포넌트**: `front-end/src/components/Store/OrderList.tsx`
-   **핵심 함수**: `setSelectedOrder(order)` (UI에서 상세 정보를 모달로 표시하기 위해 선택된 주문 상태 업데이트)
-   **API 호출**:
    -   `GET /api/customer-orders/{orderId}`

### ⬅️ Backend

-   **Controller**: `src/.../domain/order/controller/CustomerOrderController.java`
    -   **Method**: `getOrderDetail(@AuthenticationPrincipal AppUser user, @PathVariable Long orderId)`
    -   **역할**: `orderId`와 인증된 사용자(`storeId`)를 받아 서비스 계층에 전달합니다. 다른 가맹점의 주문에 접근 시 `403 Forbidden`을 반환합니다.
-   **Service**: `src/.../domain/order/order/service/CustomerOrderService.java`
    -   **Method**: `getOrderDetail(Long storeId, Long orderId)`
    -   **역할**:
        -   `orderRepository.findById(orderId)`를 통해 `CustomerOrder` 엔티티를 조회합니다.
        -   조회된 주문의 `storeId`와 요청된 `storeId`를 비교하여 접근 권한을 확인합니다.
        -   `detailRepository.findByOrder_Id(orderId)`를 통해 주문 상세 품목(`CustomerOrderDetail`) 목록을 조회합니다.
        -   `CustomerOrderDetailDTO.from()`을 통해 주문 및 상세 정보를 포함하는 DTO로 변환하여 반환합니다.
-   **Repository**:
    -   `src/.../domain/order/repository/CustomerOrderRepository.java`
        -   **Method**: `findById(Long id)`: `CustomerOrder` 엔티티를 조회합니다. (`@EntityGraph`를 통해 `store`, `details`, `details.menuIdFk`를 함께 로드)
    -   `src/.../domain/order/repository/CustomerOrderDetailRepository.java`
        -   **Method**: `findByOrder_Id(Long orderId)`: 특정 주문에 속한 모든 `CustomerOrderDetail`을 조회합니다.

---

## 4. 주문 상태 변경

주문 목록에서 특정 주문의 상태(예: `pending` -> `preparing` -> `cooking` -> `ready` -> `completed` -> `cancelled`)를 변경하는 기능입니다.

### ➡️ Frontend

-   **컴포넌트**: `front-end/src/components/Store/OrderList.tsx`
-   **핵심 함수**:
    -   `updateOrderStatus(order: Order, newStatus: string)`: 주문 상태를 업데이트합니다.
    -   `cancelOrder(order: Order, reason: string)`: 주문을 취소합니다.
-   **API 호출**:
    -   `PATCH /api/customer-orders/{orderId}/status`
-   **요청 Body**:
    ```json
    {
      "status": "PENDING | PREPARING | COOKING | READY | COMPLETED | CANCELLED"
    }
    ```

### ⬅️ Backend

-   **Controller**: `src/.../domain/order/controller/CustomerOrderController.java`
    -   **Method**: `updateStatus(@PathVariable Long orderId, @RequestBody UpdateStatusRequestDTO body)`
    -   **역할**: `orderId`와 요청 본문(`UpdateStatusRequestDTO`)에서 `status`를 추출하여 서비스 계층에 전달합니다.
-   **Service**: `src/.../domain/order/service/CustomerOrderService.java`
    -   **Method**: `updateStatus(Long orderId, String statusText)`
    -   **역할**:
        -   `orderRepository.findById(orderId)`를 통해 `CustomerOrder` 엔티티를 조회합니다.
        -   `statusText`를 `OrderStatus` enum으로 변환하여 주문 엔티티의 상태를 업데이트합니다. (`@Transactional`에 의해 자동으로 변경사항이 영속화됩니다.)
-   **Repository**:
    -   `src/.../domain/order/repository/CustomerOrderRepository.java`
        -   **Method**: `findById(Long id)`: 상태를 변경할 `CustomerOrder` 엔티티를 조회합니다.
