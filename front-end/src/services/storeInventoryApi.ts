import api from '../lib/authApi';
import type { StoreInventoryItemResponse } from '../types/storeInventory';

const BASE_PATH = '/API/store/inventory';

/**
 * 가맹점 재고 초기화
 * POST /API/store/inventory/init?storeId=...
 * 결과: 생성된 StoreInventory 행 개수
 */
export async function initStoreInventory(storeId: number): Promise<number> {
  const res = await api.post<number>(
    '/API/store/inventory/init',
    null,
    { params: { storeId } },
  );
  return res.data;
}

/**
 * 가맹점 재고 목록 조회
 * GET /API/store/inventory/list?storeId=...
 */
export interface StoreInventoryResponse {
  id: number;                 // storeInventoryId
  storeMaterialId: number;    // FK
  code: string;
  name: string;
  category: string | null;
  baseUnit: string | null;
  optimalQuantity: number | null;
  quantity: number;           // 현재 재고
  purchasePrice: number | null;
  supplier: string | null;
  status: 'SUFFICIENT' | 'LOW' | 'SHORTAGE';
}

export async function fetchStoreInventory(
  storeId: number,
): Promise<StoreInventoryResponse[]> {
  const res = await api.get<StoreInventoryResponse[]>(
    '/API/store/inventory/list',
    { params: { storeId } },
  );
  return res.data;
}