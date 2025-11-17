import api from '../lib/authApi';
import type {
  StoreMaterialCreateRequest,
  StoreMaterialResponse,
} from '../types/storeMaterial';

const BASE_PATH = '/API/store/material';

// ✅ InventoryManagement에서 쓰는 함수형 API
export async function createStoreMaterial(
  payload: StoreMaterialCreateRequest,
): Promise<number> {
  const res = await api.post<StoreMaterialResponse>(BASE_PATH, payload);
  return res.data.id; // 토스트에서 쓰려는 newId
}

// (원래 object 스타일이 필요하면 유지해도 됨 – 안 쓰면 생략 가능)
export const StoreMaterialApi = {
  createStoreMaterial,
  getStoreMaterials(storeId: number) {
    return api.get<StoreMaterialResponse[]>(`${BASE_PATH}/list`, {
      params: { storeId },
    });
  },
};
