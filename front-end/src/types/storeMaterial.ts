// 가맹점 재료 상태
export type MaterialStatus = 'USE' | 'STOP';

// 보관 온도
export type MaterialTemperature = 'TEMPERATURE' | 'REFRIGERATE' | 'FREEZE';


export interface StoreMaterialCreateRequest {
  // ✅ 가맹점 ID (임시로 하드코딩해서 보내고, 나중에 로그인 세션/전역 상태로 대체)
  storeId: number;

  // 가맹점 재료 코드 (점포 내 unique)
  code: string;

  // 가맹점 표시명
  name: string;

  // 카테고리 (MaterialCategory 이름 문자열)
  category?: string | null;

  // 소진 단위 (개, g, 샷 등)
  baseUnit?: string | null;

  // 입고 단위 (박스, 봉, kg 등)
  salesUnit?: string | null;

  // 변환비율(입고단위 → 소진단위)
  conversionRate: number;

  // 공급업체명
  supplier?: string | null;

  // 보관온도
  temperature?: MaterialTemperature | null;

  // 재료 상태
  status: MaterialStatus;

  // 적정 재고 (소진 단위 기준)
  optimalQuantity?: number | null;
  
  // 최근 매입단가 (입고단위 기준)
  purchasePrice?: number | null;

  // 본사 재료 선택 시 materialId, 자체 재료면 null
  hqMaterialId: number | null;
}


// 서버 응답 DTO (id 포함)
export interface StoreMaterialResponse {
  id: number;
  storeId: number;
  code: string;
  name: string;
  status: 'USE' | 'STOP';
  optimalQuantity: number | null;
  purchasePrice: number | null;
  hqMaterial: boolean;
}