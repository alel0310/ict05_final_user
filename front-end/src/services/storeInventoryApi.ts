import api from '../lib/authApi';
import type {
  StoreInventoryResponse,
  StoreInventoryRestockRequest,
} from '../types/storeInventory';

const BASE_PATH = '/API/store/inventory';

/**
 * 가맹점 재고 초기화
 *
 * - 지정 매장에 대해 StoreMaterial 기준으로 StoreInventory를 0부터 생성한다.
 * - 이미 존재하는 (store, storeMaterial) 조합은 건너뛰고, 없는 것만 새로 추가한다.
 *
 * POST /API/store/inventory/init
 *
 * JWT(@AuthenticationPrincipal) 기반: 파라미터 없음
 * @returns 새로 생성된 StoreInventory 행 개수
 */
export async function initStoreInventory(): Promise<number> {
  const res = await api.post<number>(`${BASE_PATH}/init`);
  return res.data;
}

/**
 * 가맹점 재고 목록 조회
 *
 * - InventoryManagement 화면의 메인 그리드 데이터 소스
 * - StoreInventory + StoreMaterial 조인 결과를 내려주는 백엔드 DTO와 1:1로 매핑
 *
 * GET /API/store/inventory/list
 * 
 * JWT(@AuthenticationPrincipal) 기반: 파라미터 없음
 * @returns 재고 목록 DTO 배열
 */
export async function fetchStoreInventory(): Promise<StoreInventoryResponse[]> {
  const res = await api.get<StoreInventoryResponse[]>(`${BASE_PATH}/list`);
  return res.data;
}

/**
 * 가맹점 재고 입고(재입고)
 *
 * - 단일 StoreMaterial에 대해 수량을 증가시키고
 *   StoreInventoryBatch를 생성한 뒤, 최종 StoreInventory 스냅샷을 반환한다.
 *
 * POST /API/store/inventory/restock
 * 
 * JWT(@AuthenticationPrincipal) 기반: 파라미터 없음
 */
export async function restockStoreInventory(
  payload: StoreInventoryRestockRequest,
): Promise<void> {
  await api.post(`${BASE_PATH}/restock`, payload);
}