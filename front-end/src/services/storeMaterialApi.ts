import api from '../lib/authApi';
import type {
  StoreMaterialCreateRequest,
  StoreMaterialResponse,
  StoreMaterialUpdateOptimalDTO,
  StoreMaterialUpdateStatusDTO,
  StoreMaterialStatus,
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
    return data; // ResponseEntity<Long>
  }
  if (data && typeof data.id === 'number') {
    return data.id; // StoreMaterialResponse { id, ... }
  }
  return null;
}

/**
 * 가맹점 재료 목록 조회
 * 
 * GET /API/store/material/list
 * 
 * JWT(@AuthenticationPrincipal) 기반: 파라미터 없음
 */
export async function fetchStoreMaterials(): Promise<StoreMaterialResponse[]> {
  const res = await api.get<StoreMaterialResponse[]>(`${BASE_PATH}/list`);
  return res.data;
}

/**
 * 가맹점 재료 적정재고(최소 재고) 업데이트
 *
 * - 엔드포인트: PATCH /API/store/material/{id}/optimal-quantity
 * - 계약: 컨트롤러가 인증 사용자(AppUser)의 storeId를 내부에서 사용
 * - 비고: optimalQuantity는 소진 단위 기준. null 허용.
 */
export async function updateStoreMaterialOptimalQuantity(
  storeMaterialId: number,
  optimalQuantity: number | null,
): Promise<void> {
  if (typeof storeMaterialId !== 'number' || storeMaterialId <= 0) {
    throw new Error('유효하지 않은 storeMaterialId 입니다.');
  }
  if (optimalQuantity != null) {
    if (typeof optimalQuantity !== 'number' || Number.isNaN(optimalQuantity) || optimalQuantity < 0) {
      throw new Error('optimalQuantity 값이 유효하지 않습니다.');
    }
  }

  await api.patch(`${BASE_PATH}/${storeMaterialId}/optimal-quantity`, {
    optimalQuantity,
  } satisfies Omit<StoreMaterialUpdateOptimalDTO, 'storeMaterialId'>);
}

/**
 * 가맹점 재료 상태(사용/중지) 업데이트
 *
 * - 엔드포인트: PATCH /API/store/material/{id}/status
 * - 계약: 컨트롤러가 인증 사용자(AppUser)의 storeId를 내부에서 사용
 * - 비고:
 *   - 본사 재료만 노출/사용하는 토글이라면, 프런트에서 비본사 재료는 토글 숨김 처리 권장.
 *   - 백엔드는 storeId 소유권과 상태 전이 정책을 검증해야 한다.
 */
export async function updateStoreMaterialStatus(
  storeMaterialId: number,
  status: StoreMaterialStatus,
): Promise<void> {
  if (typeof storeMaterialId !== 'number' || storeMaterialId <= 0) {
    throw new Error('유효하지 않은 storeMaterialId 입니다.');
  }
  if (status !== 'USE' && status !== 'STOP') {
    throw new Error('status 값이 유효하지 않습니다.');
  }

  await api.patch(`${BASE_PATH}/${storeMaterialId}/status`, {
    status,
  } satisfies Omit<StoreMaterialUpdateStatusDTO, 'storeMaterialId'>);
}

// ---------- Settings PATCH (적정재고/사용여부) ----------
export interface StoreMaterialSettingsUpdateRequest {
  /** 소수 3자리까지 허용, null이면 변경 없음 */
  optimalQuantity?: number | null;
  /** "USE" | "STOP", 지정 안 하면 변경 없음 */
  status?: 'USE' | 'STOP';
}

export interface StoreMaterialSettingsResponse {
  storeMaterialId: number;
  optimalQuantity: number | null;
  status: 'USE' | 'STOP';
  inventory?: {
    storeInventoryId: number;
    optimalQuantity: number | null;
    status: 'SUFFICIENT' | 'LOW' | 'SHORTAGE';
  };
}

/**
+ * 상세 팝업 저장: 적정재고/사용여부(USE/STOP) 수정
+ * PATCH /api/store/materials/{id}/settings
+ */
export async function updateStoreMaterialSettings(
  storeMaterialId: number,
  payload: StoreMaterialSettingsUpdateRequest
): Promise<StoreMaterialSettingsResponse> {
  const { data } = await api.patch<StoreMaterialSettingsResponse>(`${BASE_PATH}/${storeMaterialId}/settings`, payload);
  return data;
}
