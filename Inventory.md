# 재고 관리 기능 명세서

## 1. 상세 기능 명세서

### **1.1. 재고 현황 조회**
- **기능**: 가맹점의 전체 재고 품목 목록을 조회합니다.
- **Frontend**:
  - **경로**: `front-end/src/components/Store/InventoryManagement.tsx`
  - **URL**: (React Router에 의해 결정, 예: `/inventory`)
  - **주요기능**:
    - 페이지 로드 시 백엔드에 재고 목록을 요청하여 테이블 형태로 출력합니다.
    - 품목명, 재고 수준, 유통기한 등 주요 정보를 시각적으로 표시합니다.
    - 검색 및 페이지네이션 기능을 제공합니다.
- **Backend**:
  - **Controller**: `StoreInventoryRestController`
  - **Method**: `getStoreInventoryList`
  - **Endpoint**: `GET /API/store/inventory/list`
  - **Service**: `StoreInventoryService`
  - **주요로직**: `StoreInventoryRepository.findByStore_Id()`를 호출하여 해당 가맹점의 모든 재고 정보를 조회하고, `StoreInventoryListDTO` 목록으로 변환하여 반환합니다.

### **1.2. 초기 재고 생성 (누락분)**
- **기능**: 가맹점의 모든 재료(`StoreMaterial`)를 기준으로 아직 재고(`StoreInventory`) 레코드가 없는 품목에 대해 수량 0으로 초기 재고를 생성합니다.
- **Frontend**:
  - **경로**: `front-end/src/components/Store/InventoryManagement.tsx`
  - **URL**: N/A
  - **주요기능**:
    - '초기 재고 세팅' 버튼 클릭 시, 시스템에 재고 누락분을 생성하도록 요청합니다.
- **Backend**:
  - **Controller**: `StoreInventoryRestController`
  - **Method**: `initInventory`
  - **Endpoint**: `POST /API/store/inventory/init`
  - **Service**: `StoreInventoryService`
  - **주요로직**: 매장에 존재하는 `StoreMaterial` 목록을 조회하고, `StoreInventory`가 없는 경우 `StoreInventory` 엔티티를 수량 0으로 생성하여 저장합니다.

### **1.3. 재료 등록**
- **기능**: 가맹점에서 자체적으로 사용하는 새로운 재료를 시스템에 등록하고, 해당 재료에 대한 초기 재고 레코드를 생성합니다.
- **Frontend**:
  - **경로**: `front-end/src/components/Store/InventoryManagement.tsx`
  - **URL**: N/A (모달 팝업으로 처리)
  - **주요기능**:
    - '재료등록' 버튼 클릭 시, 품목명, 카테고리, 단위 등을 입력받는 폼 모달을 엽니다.
    - 입력된 정보로 백엔드에 재료 생성을 요청합니다.
- **Backend**:
  - **Controller**: `StoreMaterialRestController`
  - **Method**: `createStoreMaterial`
  - **Endpoint**: `POST /API/store/material`
  - **Service**: `StoreMaterialService`
  - **주요로직**: `StoreMaterialCreateDTO`를 받아 `StoreMaterial` 엔티티를 생성하고 `StoreMaterialRepository.save()`로 저장합니다. 동시에 해당 재료의 초기 재고(`StoreInventory`) 레코드를 0으로 생성하여 함께 저장합니다.

### **1.4. 재고 입고 (상세 이력 관리)**
- **기능**: 품목의 재고 수량을 증가시키고, 입고 단가 정책을 적용하며, 상세 입고 이력을 기록합니다.
- **Frontend**:
  - **경로**: `front-end/src/components/Store/InventoryManagement.tsx`
  - **URL**: N/A (모달 팝업으로 처리)
  - **주요기능**:
    - 재고 목록에서 '입고' 버튼 클릭 시, 입고 수량과 메모를 입력받는 폼 모달을 엽니다.
    - 입력된 정보로 백엔드에 입고 처리를 요청합니다.
- **Backend**:
  - **Controller**: `StoreInventoryRestController`
  - **Method**: `inbound`
  - **Endpoint**: `POST /API/store/inventory/in`
  - **Service**: `StoreInboundService`
  - **주요로직**: `StoreInventoryInWriteDTO`를 받아 입고 단가 결정 규칙(`요청 단가 → HQ 판매가 → 매장 최근 입고가`)에 따라 단가를 결정합니다. `StoreInventoryRepository`에서 비관적 락(for-update)으로 재고를 조회하여 수량을 더한 후 저장하고, `StoreInventoryInRepository.save()`로 입고 이력을 기록합니다.

### **1.5. 재고 조정**
- **기능**: 파손, 분실, 실사 등의 이유로 재고 수량을 강제로 특정 값으로 변경하고, 조정 이력을 기록합니다.
- **Frontend**:
  - **경로**: `front-end/src/components/Store/InventoryManagement.tsx`
  - **URL**: N/A (모달 팝업으로 처리)
  - **주요기능**:
    - 재고 목록에서 '조정' 버튼 클릭 시, 새로운 재고 수량과 조정 사유를 입력받는 폼 모달을 엽니다.
    - 입력된 정보로 백엔드에 재고 조정을 요청합니다.
- **Backend**:
  - **Controller**: `StoreInventoryRestController`
  - **Method**: `adjust`
  - **Endpoint**: `POST /API/store/inventory/adjust`
  - **Service**: `StoreAdjustmentService`
  - **주요로직**: `StoreInventoryAdjustmentWriteDTO`를 받아 조정 전/후 수량과 차이를 계산하여 `StoreInventoryAdjustmentRepository.save()`로 이력을 저장하고, `StoreInventory`의 수량을 절대값으로 업데이트합니다.

### **1.6. 발주 생성 (장바구니)**
- **기능**: 재고가 부족한 여러 품목을 선택하여 하나의 발주 요청을 생성합니다.
- **Frontend**:
  - **경로**: `front-end/src/components/Store/InventoryManagement.tsx`
  - **URL**: N/A (모달 팝업으로 처리)
  - **주요기능**:
    - 재고 목록에서 여러 품목을 체크박스 로 선택하고 '발주 등록' 버튼을 클릭합니다.
    - 열리는 장바구니 모달에서 품목별 발주 수량을 최종 조절하고, '발주 등록'을 실행합니다.
- **Backend**:
  - **Controller**: `PurchaseOrderController` (추정)
  - **Method**: `createPurchaseOrder` (추정)
  - **Endpoint**: `POST /api/purchase/create`
  - **Service**: `PurchaseOrderService` (추정)
  - **주요로직**: `PurchaseOrderRequestsDTO`를 받아 `PurchaseOrder` 및 `PurchaseOrderDetail` 엔티티들을 생성하고 저장합니다.

### **1.7. 재료 상세 설정 업데이트 (적정재고, 사용 여부)**
- **기능**: 재료의 적정 재고 수량과 사용 여부(USE/STOP)를 동시에 업데이트합니다.
- **Frontend**:
  - **경로**: `front-end/src/components/Store/InventoryManagement.tsx` (`ItemDetailContent` 컴포넌트)
  - **URL**: N/A (모달 팝업 내에서 API 호출)
  - **주요기능**:
    - 재고 상세 팝업 내에서 적정 재고 및 사용 여부를 변경하고 '저장' 버튼 클릭 시 요청합니다.
- **Backend**:
  - **Controller**: `StoreMaterialRestController`
  - **Method**: `updateSettings`
  - **Endpoint**: `PATCH /API/store/material/{id}/settings`
  - **Service**: `StoreMaterialService`
  - **주요로직**: `StoreMaterialRepository`에서 재료를 비관적 락(for-update)으로 조회하여 `optimalQuantity`와 `status`를 업데이트합니다. 연관된 `StoreInventory`의 적정재고도 동기화하고 재고 상태를 재계산합니다.

### **1.8. 재고 간단 입고 (집계 재고 가산)**
- **기능**: 기존 집계 재고 수량을 간단하게 가산하며 상태 및 업데이트 일시를 동기화합니다. 배치/단가/유통기한 관리가 필요 없는 경우에 사용합니다.
- **Frontend**: N/A (분석된 프론트엔드 컴포넌트에서 직접 사용되지 않음)
- **Backend**:
  - **Controller**: `StoreInventoryRestController`
  - **Method**: `restock`
  - **Endpoint**: `POST /API/store/inventory/restock`
  - **Service**: `StoreInventoryService`
  - **주요로직**: `StoreInventoryRepository.findById()`로 재고를 조회하여 요청 수량을 가산하고, 재고 상태 및 업데이트 일시를 동기화하여 저장합니다.

### **1.9. 판매 소진 처리**
- **기능**: 가맹점 재료 기준으로 정규화된 소진 라인 목록을 받아 재고를 차감하고 소진 이력을 저장합니다.
- **Frontend**: N/A (분석된 프론트엔드 컴포넌트에서 직접 사용되지 않음)
- **Backend**:
  - **Controller**: `StoreInventoryRestController`
  - **Method**: `consume`
  - **Endpoint**: `POST /API/store/inventory/consume`
  - **Service**: `StoreConsumptionService`
  - **주요로직**: `StoreConsumeRequestDTO`의 각 라인에 대해 재고 부족 여부를 선검증한 후, `StoreInventoryRepository`에서 재고를 조회하여 수량을 차감하고 `StoreInventoryOutRepository.save()`로 소진 이력을 기록합니다.

### **1.10. 본사 재료 일괄 동기화 및 초기 재고 생성**
- **기능**: 본사에서 사용하는 재료 중 사용 상태(`USE`)인 항목들을 가맹점 `StoreMaterial`로 일괄 매핑하고, 각 항목에 대한 초기 재고(`StoreInventory`)를 수량 0으로 생성합니다.
- **Frontend**: N/A (분석된 프론트엔드 컴포넌트에서 직접 사용되지 않음)
- **Backend**:
  - **Controller**: `StoreMaterialRestController`
  - **Method**: `syncHqMaterials`
  - **Endpoint**: `POST /API/store/material/sync-hq`
  - **Service**: `StoreMaterialService`
  - **주요로직**: `MaterialRepository.findByMaterialStatus()`로 본사 재료를 조회하고, 이미 매핑되지 않은 경우 `StoreMaterial`과 `StoreInventory`를 생성하여 저장합니다.

### **1.11. 가맹점 재료 기반 초기 재고 생성**
- **기능**: 특정 가맹점의 모든 `StoreMaterial`에 대해, 아직 `StoreInventory`가 없는 경우 수량 0으로 재고를 생성합니다. (기존 `StoreInventoryRestController`의 `/init`과 유사하지만, `StoreMaterialService`에서 관리)
- **Frontend**: N/A (분석된 프론트엔드 컴포넌트에서 직접 사용되지 않음)
- **Backend**:
  - **Controller**: `StoreMaterialRestController`
  - **Method**: `initInventory`
  - **Endpoint**: `POST /API/store/material/init-inventory`
  - **Service**: `StoreMaterialService`
  - **주요로직**: `StoreMaterialRepository.findByStore()`로 가맹점 재료 목록을 조회하고, `StoreInventory`가 없는 항목에 대해 초기 재고를 생성하여 저장합니다.

### **1.12. 재료 적정 재고 단일 업데이트**
- **기능**: 특정 재료의 적정 재고 수량만 업데이트합니다.
- **Frontend**: N/A (이 기능보다는 `updateSettings`를 통해 적정재고와 사용여부를 함께 업데이트하는 방식이 프론트엔드에 적용될 가능성이 높음)
- **Backend**:
  - **Controller**: `StoreMaterialRestController`
  - **Method**: `updateOptimalQuantity`
  - **Endpoint**: `PATCH /API/store/material/{id}/optimal-quantity`
  - **Service**: `StoreMaterialService`
  - **주요로직**: `StoreMaterialRepository.findByIdAndStore_Id()`로 재료를 조회하여 `optimalQuantity` 필드를 업데이트합니다.

### **1.13. 재료 상태(사용/중지) 단일 업데이트**
- **기능**: 특정 재료의 사용 상태(USE/STOP)만 업데이트합니다.
- **Frontend**: N/A (이 기능보다는 `updateSettings`를 통해 적정재고와 사용여부를 함께 업데이트하는 방식이 프론트엔드에 적용될 가능성이 높음)
- **Backend**:
  - **Controller**: `StoreMaterialRestController`
  - **Method**: `updateStatus`
  - **Endpoint**: `PATCH /API/store/material/{id}/status`
  - **Service**: `StoreMaterialService`
  - **주요로직**: `StoreMaterialRepository.findByIdAndStore_Id()`로 재료를 조회하여 `status` 필드를 업데이트합니다.

## 2. 프로그램 목록

| 사이트 | 대메뉴 | 중메뉴 | 소메뉴 | 컨트롤러-메서드명() | 서비스-메서드명() | 리파지토리-메서드명() | 프론트엔드 |
|---|---|---|---|---|---|---|---|
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 목록 조회 | `StoreInventoryRestController-getStoreInventoryList()` | `StoreInventoryService-getStoreInventoryList()` | `StoreInventoryRepository-findByStore_Id()` | `InventoryManagement.tsx` |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 초기 재고 생성 | `StoreInventoryRestController-initInventory()` | `StoreInventoryService-initInventoryForStore()` | `StoreRepository-findById()` | `InventoryManagement.tsx` |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 초기 재고 생성 | `StoreInventoryRestController-initInventory()` | `StoreInventoryService-initInventoryForStore()` | `StoreMaterialRepository-findByStore()` | `InventoryManagement.tsx` |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 초기 재고 생성 | `StoreInventoryRestController-initInventory()` | `StoreInventoryService-initInventoryForStore()` | `StoreInventoryRepository-existsByStoreAndStoreMaterial()` | `InventoryManagement.tsx` |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 초기 재고 생성 | `StoreInventoryRestController-initInventory()` | `StoreInventoryService-initInventoryForStore()` | `StoreInventoryRepository-save()` | `InventoryManagement.tsx` |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 입고 (상세) | `StoreInventoryRestController-inbound()` | `StoreInboundService-inbound()` | `StoreInventoryRepository-findByStoreIdAndStoreMaterialIdForUpdate()` | `InventoryManagement.tsx` |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 입고 (상세) | `StoreInventoryRestController-inbound()` | `StoreInboundService-inbound()` | `StoreMaterialRepository-findByIdAndStore_Id()` | `InventoryManagement.tsx` |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 입고 (상세) | `StoreInventoryRestController-inbound()` | `StoreInboundService-inbound()` | `UnitPriceJdbcRepository-findLatestSellingPriceByMaterialId()` (조건부) | `InventoryManagement.tsx` |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 입고 (상세) | `StoreInventoryRestController-inbound()` | `StoreInboundService-inbound()` | `StoreInventoryInRepository-findFirstByStoreMaterial_IdOrderByCreatedAtDesc()` (조건부) | `InventoryManagement.tsx` |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 입고 (상세) | `StoreInventoryRestController-inbound()` | `StoreInboundService-inbound()` | `StoreInventoryRepository-save()` | `InventoryManagement.tsx` |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 입고 (상세) | `StoreInventoryRestController-inbound()` | `StoreInboundService-inbound()` | `StoreInventoryInRepository-save()` | `InventoryManagement.tsx` |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 재고 조정 | `StoreInventoryRestController-adjust()` | `StoreAdjustmentService-adjust()` | `StoreMaterialRepository-findById()` | `InventoryManagement.tsx` |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 재고 조정 | `StoreInventoryRestController-adjust()` | `StoreAdjustmentService-adjust()` | `StoreInventoryRepository-findByStoreIdAndStoreMaterialId()` | `InventoryManagement.tsx` |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 재고 조정 | `StoreInventoryRestController-adjust()` | `StoreAdjustmentService-adjust()` | `StoreInventoryAdjustmentRepository-save()` | `InventoryManagement.tsx` |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 재고 조정 | `StoreInventoryRestController-adjust()` | `StoreAdjustmentService-adjust()` | `StoreInventoryRepository-save()` | `InventoryManagement.tsx` |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 재료 등록 | `StoreMaterialRestController-createStoreMaterial()` | `StoreMaterialService-create()` | `StoreRepository-findById()` | `InventoryManagement.tsx` |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 재료 등록 | `StoreMaterialRestController-createStoreMaterial()` | `StoreMaterialService-create()` | `StoreMaterialRepository-existsByStoreAndCode()` | `InventoryManagement.tsx` |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 재료 등록 | `StoreMaterialRestController-createStoreMaterial()` | `StoreMaterialService-create()` | `StoreMaterialRepository-save()` | `InventoryManagement.tsx` |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 재료 등록 | `StoreMaterialRestController-createStoreMaterial()` | `StoreMaterialService-create()` | `StoreInventoryRepository-existsByStoreAndStoreMaterial()` | `InventoryManagement.tsx` |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 재료 등록 | `StoreMaterialRestController-createStoreMaterial()` | `StoreMaterialService-create()` | `StoreInventoryRepository-save()` | `InventoryManagement.tsx` |
| [가맹점 시스템] | [재고 관리] | 발주 관리 | 발주 생성 | `PurchaseOrderController-createPurchaseOrder()` (추정) | `PurchaseOrderService-create()` (추정) | `PurchaseOrderRepository-save()` (추정) | `InventoryManagement.tsx` (장바구니) |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 재료 목록 조회 | `StoreMaterialRestController-list()` | `StoreMaterialService-getStoreMaterials()` | `StoreRepository-findById()` | N/A |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 재료 목록 조회 | `StoreMaterialRestController-list()` | `StoreMaterialService-getStoreMaterials()` | `StoreMaterialRepository-findByStore()` | N/A |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 재료 설정 변경 | `StoreMaterialRestController-updateSettings()` | `StoreMaterialService-updateSettings()` | `StoreMaterialRepository-findByIdAndStoreIdForUpdate()` | `InventoryManagement.tsx` |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 재료 설정 변경 | `StoreMaterialRestController-updateSettings()` | `StoreMaterialService-updateSettings()` | `StoreInventoryRepository-findByStore_IdAndStoreMaterial_Id()` | `InventoryManagement.tsx` |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 재료 설정 변경 | `StoreMaterialRestController-updateSettings()` | `StoreMaterialService-updateSettings()` | `StoreInventoryRepository-save()` | `InventoryManagement.tsx` |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 적정 재고 변경 | `StoreMaterialRestController-updateOptimalQuantity()` | `StoreMaterialService-updateOptimalQuantity()` | `StoreMaterialRepository-findByIdAndStore_Id()` | N/A |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 재료 상태 변경 | `StoreMaterialRestController-updateStatus()` | `StoreMaterialService-updateStatus()` | `StoreMaterialRepository-findByIdAndStore_Id()` | N/A |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 입고 (간단) | `StoreInventoryRestController-restock()` | `StoreInventoryService-restock()` | `StoreInventoryRepository-findById()` | N/A |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 입고 (간단) | `StoreInventoryRestController-restock()` | `StoreInventoryService-restock()` | `StoreInventoryRepository-save()` | N/A |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 판매 소진 | `StoreInventoryRestController-consume()` | `StoreConsumptionService-consume()` | `StoreMaterialRepository-findById()` | N/A |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 판매 소진 | `StoreInventoryRestController-consume()` | `StoreConsumptionService-consume()` | `StoreInventoryRepository-findByStoreIdAndStoreMaterialId()` | N/A |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 판매 소진 | `StoreInventoryRestController-consume()` | `StoreConsumptionService-consume()` | `StoreInventoryRepository-save()` | N/A |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 판매 소진 | `StoreInventoryRestController-consume()` | `StoreConsumptionService-consume()` | `StoreInventoryOutRepository-save()` | N/A |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 본사 재료 동기화| `StoreMaterialRestController-syncHqMaterials()` | `StoreMaterialService-mapAllHqMaterialsToStore()` | `StoreRepository-findById()` | N/A |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 본사 재료 동기화| `StoreMaterialRestController-syncHqMaterials()` | `StoreMaterialService-mapAllHqMaterialsToStore()` | `MaterialRepository-findByMaterialStatus()` | N/A |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 본사 재료 동기화| `StoreMaterialRestController-syncHqMaterials()` | `StoreMaterialService-mapAllHqMaterialsToStore()` | `StoreMaterialRepository-existsByStoreAndMaterial()` | N/A |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 본사 재료 동기화| `StoreMaterialRestController-syncHqMaterials()` | `StoreMaterialService-mapAllHqMaterialsToStore()` | `StoreMaterialRepository-save()` | N/A |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 본사 재료 동기화| `StoreMaterialRestController-syncHqMaterials()` | `StoreMaterialService-mapAllHqMaterialsToStore()` | `StoreInventoryRepository-save()` | N/A |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 재료기반 재고생성| `StoreMaterialRestController-initInventory()` | `StoreMaterialService-initStoreInventoryForStore()` | `StoreRepository-findById()` | N/A |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 재료기반 재고생성| `StoreMaterialRestController-initInventory()` | `StoreMaterialService-initStoreInventoryForStore()` | `StoreMaterialRepository-findByStore()` | N/A |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 재료기반 재고생성| `StoreMaterialRestController-initInventory()` | `StoreMaterialService-initStoreInventoryForStore()` | `StoreInventoryRepository-findByStore()` | N/A |
| [가맹점 시스템] | [재고 관리] | 재고 현황 | 재료기반 재고생성| `StoreMaterialRestController-initInventory()` | `StoreMaterialService-initStoreInventoryForStore()` | `StoreInventoryRepository-save()` | N/A |