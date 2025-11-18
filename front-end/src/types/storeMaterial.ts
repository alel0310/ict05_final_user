// 가맹점 재료 상태
export type MaterialStatus = 'USE' | 'STOP';

// 보관 온도
export type MaterialTemperature = 'TEMPERATURE' | 'REFRIGERATE' | 'FREEZE';

// 카테고리
export type MaterialCategory =
  | 'BASE'
  | 'TOPPING'
  | 'SIDE'
  | 'SAUCE'
  | 'BEVERAGE'
  | 'PACKAGE'
  | 'ETC';

export interface StoreMaterialCreateRequest {
  // ✅ 가맹점 ID
  storeId: number;

  // 가맹점 표시명
  name: string;

  // 카테고리 (MaterialCategory 이름 문자열)
  category?: MaterialCategory | null;

  // 소진 단위 (개, g, 샷 등)
  baseUnit?: string | null;

  // 입고 단위 (박스, 봉, kg 등)
  salesUnit?: string | null;

  // 변환비율(입고단위 → 소진단위), 미입력시 100
  conversionRate?: number | null;

  // 공급업체명
  supplier?: string | null;

  // 보관온도
  temperature?: MaterialTemperature | null;

  // 적정 재고 (소진 단위 기준)
  optimalQuantity?: number | null;

  // 최근 매입단가 (입고단위 기준)
  purchasePrice?: number | null;
}

// 목록/등록 응답 공통 타입
export interface StoreMaterialResponse {
  id: number;
  storeId: number;
  code: string;
  name: string;

  // 아래 셋은 프론트에서 이미 사용 중
  category?: MaterialCategory | null;
  baseUnit?: string | null;
  salesUnit?: string | null;
  supplier?: string | null;
  temperature?: MaterialTemperature | null;

  status: MaterialStatus;
  optimalQuantity: number | null;
  purchasePrice: number | null;
  hqMaterial: boolean;
}
