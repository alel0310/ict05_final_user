/**
 * 가맹점 재고 도메인 타입 정의
 *
 * - StoreInventory / StoreInventoryBatch 와 연결되는 프론트 DTO
 * - InventoryManagement 화면의 메인 데이터 소스
 */

import type { MaterialTemperature } from './storeMaterial';

// 재고 상태 (백엔드 InventoryStatus Enum과 1:1)
export type StoreInventoryStatus = 'SUFFICIENT' | 'LOW' | 'SHORTAGE';

/**
 * 가맹점 재고 목록/상세 응답 DTO
 *
 * - GET /API/store/inventory/list
 * - StoreInventory + StoreMaterial 조인 결과를 한 번에 내려받는다.
 * 
 * → 백엔드 StoreInventoryListDTO 에 맞춰서 필드명 통일
 */
export interface StoreInventoryResponse {
  // 백엔드 필드명 중 실제 내려오는 걸로 맞춰라.
  // (예: storeInventoryId 또는 id 중 하나)
  storeInventoryId?: number;

  id?: number;

  // 가맹점 재료 PK (store_material_id_fk)
  storeMaterialId: number;

  // 가맹점 재료명
  name: string;

  // 카테고리 (문자열, 없을 수 있음)
  category: string | null;

  // 소진 단위 (예: 개, g, 샷)
  baseUnit: string | null;

  // 입고 단위 (예: 박스, 봉, kg)
  salesUnit: string | null;

  // 현재 재고 수량 (소진 단위 기준)
  quantity: number | null;

  // 적정 재고 수량 (소진 단위 기준)
  optimalQuantity: number | null;

  // 최근 매입 단가 (입고 단위 기준)
  purchasePrice: number | null;

  // 공급업체명
  supplier: string | null;

  // 보관 온도
  temperature: MaterialTemperature | null;

  // 본사 재료 여부 (true=본사 재료, false=가맹점 자체 재료)
  hqMaterial: boolean;
  
  // 가장 가까운 유통기한(YYYY-MM-DD)
  nearestExpireDate: string | null;

  // 최근 재고 갱신일(YYYY-MM-DD 또는 DATETIME 문자열)
  lastUpdated: string | null;

  // 재고 상태 (SUFFICIENT / LOW / SHORTAGE)
  status: StoreInventoryStatus;
}

/**
 * 가맹점 재고 입고(재입고) 요청 DTO
 *
 * - POST /API/store/inventory/restock
 * - 단일 StoreMaterial에 대해 수량을 증가시키고,
 *   StoreInventoryBatch 를 생성한다.
 */
export interface StoreInventoryRestockRequest {
  // 가맹점 재고 PK (store_inventory_id)
  storeInventoryId: number;

  // 입고 수량 (소진 단위 기준)
  quantity: number;

  // 메모(선택)
  memo?: string | null;
}

/** 가맹점 재고 '입고' 요청 DTO
 * - 엔드포인트: POST /API/store/inventory/in
 * - 비고: 수량은 소진 단위 기준(프로젝트 정책에 맞춰 사용)
 */
export interface StoreInventoryInWriteDTO {
  /** 재고 PK (store_inventory_id) */
  storeInventoryId: number;
  /** 가맹점 재료 PK (store_material_id) */
  storeMaterialId: number;
  /** 입고 수량 (0 이상) */
  quantity: number;
  /** 메모(선택) */
  memo?: string | null;
  /** 가맹점 재료일 때만 보낼 수 있음(선택). HQ 재료면 생략 */
  unitPrice?: number;

  // 필요 시 확장 필드 (백엔드 DTO가 지원한다면 주석 해제)
  // receivedDate?: string | null;     // 'YYYY-MM-DD'
  // expirationDate?: string | null;   // 'YYYY-MM-DD'
  // lotNo?: string | null;
  // purchasePrice?: number | null;    // 입고 단가
}

/**
 * StoreInventory 도메인: 재고 조정 요청 DTO
 *
 * - 목적: 절대값 기반의 재고 수량을 지정 사유와 함께 조정한다.
 * - 사용처: POST /API/store/inventory/adjust
 * - 비고:
 *   - 백엔드는 인증 컨텍스트의 storeId와 storeInventoryId 소유권을 반드시 검증한다.
 *   - newQuantity는 0 이상의 절대 수량(음수 금지).
 */
export interface StoreInventoryAdjustmentWriteDTO {
  /** 재고 PK (store_inventory_id) – 선택된 행의 고유키 */
  storeInventoryId: number;
  
  storeMaterialId?: number;  // Optional field

  /** 조정 후 최종 재고 수량(절대값). 0 이상 정수/실수 허용(소수 사용 시 백엔드 정책 준수) */
  newQuantity: number;

  /** 조정 사유(예: '실사 조정', '손실', '폐기', '기타') */
  reason: string;

  /** 선택 메모 */
  memo?: string | null;
}
