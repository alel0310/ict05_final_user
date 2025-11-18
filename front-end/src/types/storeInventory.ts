// 백엔드 InventoryStatus Enum과 1:1 매핑
export type InventoryStatus = 'SUFFICIENT' | 'LOW' | 'SHORTAGE';

export interface StoreInventoryItemResponse {
  id: number;                 // store_inventory_id
  storeMaterialId: number | null;
  name: string;
  category: string | null;
  quantity: number;           // 현재 수량
  optimalQuantity: number | null;
  status: InventoryStatus;
  baseUnit: string | null;
  supplier: string | null;
  purchasePrice: number | null;
}
