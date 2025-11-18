import api from '../lib/authApi';
import type {
  StoreMaterialCreateRequest,
  StoreMaterialResponse,
} from '../types/storeMaterial';

const BASE_PATH = '/API/store/material';

/**
 * 가맹점 재료 등록
 * POST /API/store/material
 * 반환: 새로 생성된 storeMaterialId
 * 백엔드가 Long(id)를 주든 DTO를 주든 둘 다 대응
 * 최종적으로 id 또는 null 리턴
 */
export async function createStoreMaterial(
  payload: StoreMaterialCreateRequest,
): Promise<number | null> {
  const res = await api.post(BASE_PATH, payload);
  const data: any = res.data;

  if (typeof data === 'number') {
    // ResponseEntity<Long>
    return data;
  }
  if (data && typeof data.id === 'number') {
    // StoreMaterialResponse { id, ... }
    return data.id;
  }
  // 응답에 id가 없을 경우
  return null;
}

/**
 * 가맹점 재료 목록 조회
 * GET /API/store/material/list?storeId=...
 */
export async function fetchStoreMaterials(
  storeId: number,
): Promise<StoreMaterialResponse[]> {
  const res = await api.get<StoreMaterialResponse[]>(`${BASE_PATH}/list`, {
    params: { storeId },
  });
  return res.data;
}