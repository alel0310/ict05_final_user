/**
 * 가맹점 재료 도메인 공통 타입 정의
 *
 * - 백엔드 Material / StoreMaterial 엔티티와 1:1은 아니지만,
 *   주요 Enum/DTO 구조를 그대로 맞춘다.
 */

// 가맹점 재료 상태
export type MaterialStatus = 'USE' | 'STOP';

// 보관 온도
export type MaterialTemperature = 'TEMPERATURE' | 'REFRIGERATE' | 'FREEZE';

// 재료 카테고리 (본사 MaterialCategory Enum과 동일)
export type MaterialCategory =
  | 'BASE'
  | 'TOPPING'
  | 'SIDE'
  | 'SAUCE'
  | 'BEVERAGE'
  | 'PACKAGE'
  | 'ETC';

/**
 * 가맹점 재료 등록 요청 DTO
 *
 * - POST /API/store/material
 * - 백엔드 StoreMaterialCreateDTO 와 필드명을 최대한 맞춘다.
 */
export interface StoreMaterialCreateRequest {
  // 가맹점 표시명 (재료명)
  name: string;

  // 카테고리 (MaterialCategory 이름 문자열)
  category?: MaterialCategory | null;

  // 소진 단위 (개, g, 샷 등)
  baseUnit?: string | null;

  // 입고 단위 (박스, 봉, kg 등)
  salesUnit?: string | null;

  // 변환비율(입고단위 → 소진단위, 예: 1박스 = 100ea)
  conversionRate?: number | null;

  // 공급업체명 (대표/최근 공급처)
  supplier?: string | null;

  // 보관온도
  temperature?: MaterialTemperature | null;

  // 적정 재고 (소진 단위 기준)
  optimalQuantity?: number | null;

  // 최근 매입 단가 (입고 단위 기준)
  purchasePrice?: number | null;
}




/**
 * 가맹점 재료 목록/상세 응답 DTO
 *
 * - GET /API/store/material/list
 * - 필요시 다른 화면에서도 재사용할 수 있도록 넉넉하게 필드 포함
 */
export interface StoreMaterialResponse {
  /** 가맹점 재료 PK (store_material_id) */
  id: number;

  /** 가맹점 ID (store_id_fk) */
  storeId: number;

  /** 가맹점 재료 코드 */
  code: string;

  /** 가맹점 재료명 (표시명) */
  name: string;

  /** 카테고리 (문자열 Enum) */
  category: MaterialCategory | null;

  /** 소진 단위 */
  baseUnit: string | null;

  /** 입고 단위 */
  salesUnit: string | null;

  /** 재료 상태 (USE/STOP) */
  status: MaterialStatus;

  /** 적정 재고 (소진 단위 기준) */
  optimalQuantity: number | null;

  /** 최근 매입 단가 (입고 단위 기준) */
  purchasePrice: number | null;

  /** 공급업체명 */
  supplier: string | null;

  /** 보관온도 */
  temperature: MaterialTemperature | null;

  /** 본사 재료 여부 (true=본사 재료, false=가맹점 자체 재료) */
  hqMaterial: boolean;
}
