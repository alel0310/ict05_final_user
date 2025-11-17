import React, { useState } from 'react';
import { DataTable, Column } from '../Common/DataTable';
import { FormModal } from '../Common/FormModal';
import { ConfirmDialog, useConfirmDialog } from '../Common/ConfirmDialog';
import { StatusBadge } from '../Common/StatusBadge';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import api from '../../lib/authApi';
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  Truck,
  Calendar,
  Plus,
  Settings
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { toast } from 'sonner';
import { createStoreMaterial } from '../../services/storeMaterialApi';
import type { StoreMaterialCreateRequest, MaterialTemperature, MaterialStatus, } from '../../types/storeMaterial';

/* =======================
   타입 정의
======================= */

type StockStatus = 'sufficient' | 'low' | 'critical' | 'out';
type OrderStatus = 'pending' | 'approved' | 'shipping' | 'delivered';

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  unitPrice: number;
  lastRestocked: string;
  expiryDate: string;
  supplier: string;
  status: StockStatus;
  weeklyUsage: number;
  location: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

interface Order {
  id: string;                    // 샘플 데이터와 동일하게 문자열
  items: OrderItem[];
  supplier: string;
  orderDate: string;
  expectedDate: string;
  status: OrderStatus;
  total: number;
}

interface PurchaseOrderItemDTO {
  materialId: number;   // 재고(자재) ID = item.id
  count: number;        // 발주 수량
}
interface PurchaseOrderRequestsDTO {
  priority: 'NORMAL' | 'URGENT';
  notes?: string;
  items: PurchaseOrderItemDTO[];
}

// 장바구니용 확장 타입
type CartItem = InventoryItem & { orderQuantity: number; totalPrice: number };

/* =======================
   샘플 데이터
======================= */

const sampleInventory: InventoryItem[] = [
  { id: 1, name: '치킨패티', category: '주재료', currentStock: 45, minStock: 20, maxStock: 100, unit: '개', unitPrice: 1200, lastRestocked: '2024-12-28', expiryDate: '2025-01-15', supplier: 'ABC 식자재', status: 'sufficient', weeklyUsage: 35, location: '냉동고 A-1' },
  { id: 2, name: '감자', category: '주재료', currentStock: 8, minStock: 15, maxStock: 50, unit: 'kg', unitPrice: 2500, lastRestocked: '2024-12-25', expiryDate: '2025-01-10', supplier: 'XYZ 농산', status: 'low', weeklyUsage: 25, location: '냉장고 B-2' },
  { id: 3, name: '콜라시럽', category: '음료', currentStock: 2, minStock: 5, maxStock: 20, unit: '통', unitPrice: 15000, lastRestocked: '2024-12-20', expiryDate: '2025-06-20', supplier: '음료 공급업체', status: 'critical', weeklyUsage: 4, location: '저장고 C-1' },
  { id: 4, name: '치즈', category: '주재료', currentStock: 12, minStock: 10, maxStock: 30, unit: 'kg', unitPrice: 8000, lastRestocked: '2024-12-29', expiryDate: '2025-01-12', supplier: '유제품 공급업체', status: 'sufficient', weeklyUsage: 8, location: '냉장고 A-3' },
  { id: 5, name: '양상추', category: '채소', currentStock: 0, minStock: 5, maxStock: 15, unit: 'kg', unitPrice: 3500, lastRestocked: '2024-12-26', expiryDate: '2025-01-03', supplier: '신선 채소', status: 'out', weeklyUsage: 6, location: '냉장고 B-1' }
];

const sampleOrders: Order[] = [
  {
    id: 'PO-001',
    items: [
      { name: '감자', quantity: 30, unit: 'kg', unitPrice: 2500 },
      { name: '양상추', quantity: 10, unit: 'kg', unitPrice: 3500 }
    ],
    supplier: 'XYZ 농산',
    orderDate: '2024-12-30',
    expectedDate: '2025-01-02',
    status: 'pending',
    total: 110000
  },
  {
    id: 'PO-002',
    items: [{ name: '콜라시럽', quantity: 10, unit: '통', unitPrice: 15000 }],
    supplier: '음료 공급업체',
    orderDate: '2024-12-29',
    expectedDate: '2025-01-03',
    status: 'approved',
    total: 150000
  }
];

/* =======================
   컴포넌트
======================= */

export function InventoryManagement() {
  const [inventory, setInventory] = useState<InventoryItem[]>(sampleInventory);
  const [orders, setOrders] = useState<Order[]>(sampleOrders);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'restock' | 'adjust' | 'order' | 'register'>('restock');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { dialog } = useConfirmDialog();

  const inventoryFilters = [
    { label: '충분', value: 'sufficient', count: inventory.filter(i => i.status === 'sufficient').length },
    { label: '부족', value: 'low', count: inventory.filter(i => i.status === 'low').length },
    { label: '위험', value: 'critical', count: inventory.filter(i => i.status === 'critical').length },
    { label: '품절', value: 'out', count: inventory.filter(i => i.status === 'out').length }
  ];

  const orderFilters = [
    { label: '대기중', value: 'pending', count: orders.filter(o => o.status === 'pending').length },
    { label: '승인됨', value: 'approved', count: orders.filter(o => o.status === 'approved').length },
    { label: '배송중', value: 'shipping', count: orders.filter(o => o.status === 'shipping').length },
    { label: '완료', value: 'delivered', count: orders.filter(o => o.status === 'delivered').length }
  ];

  /* ---------- 선택/전체선택 핸들러 (선언문으로 호이스팅) ---------- */
  function handleItemSelect(itemId: number, checked: boolean) {
    setSelectedItems(prev => (checked ? [...prev, itemId] : prev.filter(id => id !== itemId)));
  }

  function handleSelectAll(checked: CheckedState) {
    const isChecked = checked === true;
    setSelectedItems(isChecked ? inventory.map(item => item.id) : []);
  }

  /* ---------- 컬럼 정의 ---------- */
  const inventoryColumns: Column<InventoryItem>[] = [
    {
      key: 'select',
      label: (
        <Checkbox
          checked={selectedItems.length === inventory.length && inventory.length > 0}
          onCheckedChange={handleSelectAll}
          className="border-gray-300"
        />
      ),
      render: (_, row) => (
        <Checkbox
          checked={selectedItems.includes(row.id)}
          onCheckedChange={(checked: any) => handleItemSelect(row.id, checked === true)}
          className="border-gray-300"
        />
      ),
      width: '60px'
    },
    {
      key: 'name',
      label: '품목정보',
      sortable: true,
      render: (value, row) => (
        <div>
          <div
            className="font-medium text-gray-900 cursor-pointer hover:text-kpi-red transition-colors"
            onClick={() => handleItemDetail(row)}
          >
            {value}
          </div>
          <div className="text-sm text-dark-gray">{row.category}</div>
          <div className="text-xs text-dark-gray">위치: {row.location}</div>
        </div>
      )
    },
    {
      key: 'currentStock',
      label: '재고현황',
      sortable: true,
      render: (value, row) => {
        const percentage = (value / row.maxStock) * 100;
        const isLow = value <= row.minStock;

        return (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-medium ${isLow ? 'text-kpi-red' : 'text-gray-900'}`}>
                {value} {row.unit}
              </span>
              {isLow && <AlertTriangle className="w-4 h-4 text-kpi-red" />}
            </div>
            <Progress
              value={percentage}
              className={`h-2 ${
                percentage <= 20 ? '[&>div]:bg-kpi-red' :
                percentage <= 50 ? '[&>div]:bg-kpi-orange' : '[&>div]:bg-kpi-green'
              }`}
            />
            <div className="text-xs text-dark-gray mt-1">
              최소: {row.minStock} / 최대: {row.maxStock}
            </div>
          </div>
        );
      }
    },
    {
      key: 'weeklyUsage',
      label: '주간사용량',
      sortable: true,
      render: (value, row) => {
        const daysLeft = Math.floor(row.currentStock / (value / 7));
        return (
          <div>
            <div className="font-medium text-gray-900">
              {value} {row.unit}
            </div>
            <div className={`text-xs ${daysLeft <= 2 ? 'text-kpi-red' : 'text-dark-gray'}`}>약 {daysLeft}일분</div>
          </div>
        );
      }
    },
    {
      key: 'expiryDate',
      label: '유통기한',
      sortable: true,
      render: (value) => {
        const expiryDate = new Date(value);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return (
          <div>
            <div className="text-sm text-gray-900">{expiryDate.toLocaleDateString('ko-KR')}</div>
            <div
              className={`text-xs ${
                daysUntilExpiry <= 3 ? 'text-kpi-red' : daysUntilExpiry <= 7 ? 'text-kpi-orange' : 'text-dark-gray'
              }`}
            >
              {daysUntilExpiry <= 0 ? '기한만료' : `${daysUntilExpiry}일 남음`}
            </div>
          </div>
        );
      }
    },
    {
      key: 'supplier',
      label: '공급업체',
      render: (value, row) => (
        <div>
          <div className="text-sm text-gray-900">{value}</div>
          <div className="text-xs text-dark-gray">₩{(row.unitPrice || 0).toLocaleString()}/{row.unit}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: '상태',
      sortable: true,
      render: (value: StockStatus) => (
        <StatusBadge
          status={value === 'sufficient' ? 'active' : value === 'low' ? 'warning' : value === 'critical' ? 'warning' : 'closed'}
          text={value === 'sufficient' ? '충분' : value === 'low' ? '부족' : value === 'critical' ? '위험' : '품절'}
        />
      )
    }
  ];

  const orderColumns: Column<Order>[] = [
    {
      key: 'id',
      label: '발주정보',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-dark-gray">{row.supplier}</div>
          <div className="text-xs text-dark-gray">발주일: {new Date(row.orderDate).toLocaleDateString('ko-KR')}</div>
        </div>
      )
    },
    {
      key: 'items',
      label: '발주품목',
      render: (value: OrderItem[]) => (
        <div className="space-y-1">
          {value.slice(0, 2).map((item, idx) => (
            <div key={idx} className="text-sm text-gray-900">
              {item.name} {item.quantity}{item.unit}
            </div>
          ))}
          {value.length > 2 && <div className="text-xs text-dark-gray">외 {value.length - 2}개</div>}
        </div>
      )
    },
    {
      key: 'total',
      label: '총액',
      sortable: true,
      render: (value: number) => <div className="font-medium text-gray-900">₩{(value || 0).toLocaleString()}</div>
    },
    {
      key: 'expectedDate',
      label: '예정일',
      render: (value: string) => <div className="text-sm text-gray-900">{new Date(value).toLocaleDateString('ko-KR')}</div>
    },
    {
      key: 'status',
      label: '상태',
      render: (value: OrderStatus) => (
        <StatusBadge
          status={value === 'pending' ? 'preparing' : value === 'approved' ? 'active' : value === 'shipping' ? 'normal' : 'active'}
          text={value === 'pending' ? '대기중' : value === 'approved' ? '승인됨' : value === 'shipping' ? '배송중' : '완료'}
        />
      )
    }
  ];

  /* ---------- 액션들 ---------- */
  const handleRestock = (item: InventoryItem) => { setSelectedItem(item); setModalType('restock'); setIsModalOpen(true); };
  const handleAdjust = (item: InventoryItem) => { setSelectedItem(item); setModalType('adjust'); setIsModalOpen(true); };
  const handleOrder = () => { setSelectedItem(null); setModalType('order'); setIsModalOpen(true); };
  const handleRegisterItem = () => { setSelectedItem(null); setModalType('register'); setIsModalOpen(true); };

  const handleBulkOrder = () => {
    if (selectedItems.length === 0) {
      toast.error('발주할 품목을 선택해주세요.');
      return;
    }
    const selectedInventoryItems = inventory.filter(item => selectedItems.includes(item.id));
    const cartData: CartItem[] = selectedInventoryItems.map(item => {
      const qty = Math.max(item.maxStock - item.currentStock, item.minStock);
      return { ...item, orderQuantity: qty, totalPrice: qty * item.unitPrice };
    });
    setCartItems(cartData);
    setIsCartModalOpen(true);
  };

  const handleItemDetail = (item: InventoryItem) => { setSelectedItem(item); setIsDetailModalOpen(true); };

  const handleUpdateMinStock = async (newMinStock: number) => {
    if (!selectedItem) return;
    try {
      setInventory(prev =>
        prev.map(item =>
          item.id === selectedItem.id
            ? {
                ...item,
                minStock: newMinStock,
                status:
                  item.currentStock <= newMinStock
                    ? item.currentStock === 0
                      ? 'out'
                      : item.currentStock <= newMinStock * 0.5
                      ? 'critical'
                      : 'low'
                    : 'sufficient'
              }
            : item
        )
      );
      setSelectedItem(prev => (prev ? { ...prev, minStock: newMinStock } : prev));
      toast.success(`${selectedItem.name}의 최소 재고량이 ${newMinStock}${selectedItem.unit}로 설정되었습니다.`);
    } catch {
      toast.error('오류가 발생했습니다.');
    }
  };

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (modalType === 'restock' && selectedItem) {
        // 입고 로직
        setInventory(prev =>
          prev.map(item =>
            item.id === selectedItem.id
              ? {
                  ...item,
                  currentStock: item.currentStock + parseInt(data.quantity, 10),
                  lastRestocked: new Date().toISOString().split('T')[0],
                  status: 'sufficient'
                }
              : item
          )
        );
        toast.success(`${selectedItem.name} ${data.quantity}${selectedItem.unit} 재입고 완료`);
      } else if (modalType === 'adjust' && selectedItem) {
        // 조정 로직
        const newQty = parseInt(data.newStock, 10);
        setInventory(prev =>
          prev.map(item =>
            item.id === selectedItem.id
              ? { ...item, currentStock: newQty, status: newQty <= item.minStock ? 'low' : 'sufficient' }
              : item
          )
        );
        toast.success(`${selectedItem.name} 재고 조정 완료`);
      } else if (modalType === 'order') {
        // 발주 로직
        const newOrder: Order = {
          id: `PO-${String(Date.now()).slice(-6)}`, // ✅ 문자열 ID
          items: [{ name: data.itemName, quantity: Number(data.quantity), unit: data.unit, unitPrice: Number(data.unitPrice) }],
          supplier: data.supplier,
          orderDate: new Date().toISOString().split('T')[0],
          expectedDate: data.expectedDate,
          status: 'pending',
          total: Number(data.quantity) * Number(data.unitPrice)
        };
        setOrders(prev => [newOrder, ...prev]);
        toast.success('발주 등록이 완료되었습니다.');
      } else if (modalType === 'register') {
        // 가맹점 재료 등록 API 연동
        

        // 1) 본사 재료 사용 여부 파싱
        const useHqMaterial =
          data.hqMaterial === true ||
          data.hqMaterial === 'true' ||
          data.hqMaterial === 'HQ';

        // 2) (임시) 가맹점 ID
        //    나중에 로그인 세션/전역 상태에서 storeId 끌어오면 여기만 교체하면 됨.
        const storeId = 2;

        // 3) payload 구성 – StoreMaterialCreateRequest와 1:1 매핑
        const payload: StoreMaterialCreateRequest = {
          storeId,

          code: data.code,
          name: data.itemName,

          category: data.category ?? null,

          baseUnit: data.baseUnit,
          salesUnit: data.salesUnit,

          conversionRate: data.conversionRate
            ? Number(data.conversionRate)
            : 1,

          supplier: data.supplier || null,

          temperature: (data.temperature || null) as
            | MaterialTemperature
            | null,

          status: (data.status || 'USE') as MaterialStatus,

          optimalQuantity: data.optimalQuantity
            ? Number(data.optimalQuantity)
            : null,

          purchasePrice: data.purchasePrice
            ? Number(data.purchasePrice)
            : null,

          // 본사 재료 연결이면 materialId, 아니면 null
          hqMaterialId:
            useHqMaterial && data.materialId
              ? Number(data.materialId)
              : null,
        };

        const newId = await createStoreMaterial(payload);

        toast.success(`'${payload.name}' 재료가 등록되었습니다. (#${newId})`);
          
        // 필요하면 로컬 목록 즉시 반영
        // (지금 InventoryItem 타입과 StoreMaterial 필드가 1:1은 아니라서
        //  임시 매핑 후 setInventory(...) 할지, 아니면 새로 조회할지 결정)
        // 예시: 최소한 적정재고/단위 정도만 붙여서 카드 숫자만 갱신
        // setInventory(prev => [...prev, toInventoryItem(payload, newId)]);
      }

      setIsModalOpen(false);
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.response?.data?.message ||
          (modalType === 'register'
            ? '가맹점 재료 등록 중 오류가 발생했습니다.'
            : '오류가 발생했습니다.'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getFormFields = () => {
    if (modalType === 'restock') {
      return [
        { name: 'quantity', label: `재입고 수량 (${selectedItem?.unit})`, type: 'number' as const, required: true, placeholder: '재입고할 수량을 입력하세요' },
        { name: 'memo', label: '메모', type: 'text' as const, required: false, placeholder: '재입고 관련 메모 (선택)' }
      ];
    } else if (modalType === 'adjust') {
      return [
        { name: 'newStock', label: `새 재고 수량 (${selectedItem?.unit})`, type: 'number' as const, required: true, placeholder: '조정할 재고 수량을 입력하세요' },
        {
          name: 'reason', label: '조정 사유', type: 'select' as const, required: true,
          options: [{ value: '실사 조정', label: '실사 조정' }, { value: '손실', label: '손실' }, { value: '폐기', label: '폐기' }, { value: '기타', label: '기타' }]
        }
      ];
    } else if (modalType === 'order') {
      return [
        { name: 'itemName', label: '품목명', type: 'text' as const, required: true },
        { name: 'quantity', label: '수량', type: 'number' as const, required: true },
        { name: 'unit', label: '단위', type: 'text' as const, required: true, placeholder: 'kg, 개, 통 등' },
        { name: 'unitPrice', label: '단가', type: 'number' as const, required: true },
        { name: 'supplier', label: '공급업체', type: 'text' as const, required: true },
        { name: 'expectedDate', label: '희망 납기일', type: 'date' as const, required: true }
      ];
    }
    // register
    return [
      {
        name: 'hqMaterial',
        label: '본사 재료 사용 여부',
        type: 'select' as const,
        required: true,
        options: [
          { value: 'false', label: '가맹점 자체 재료' },
          { value: 'true', label: '본사 재료와 연결' },
        ],
      },
      {
        name: 'materialId',
        label: '본사 재료 ID (임시)',
        type: 'number' as const,
        required: false,
        placeholder: '본사 재료와 연결 시 materialId 입력',
      },
      {
        name: 'code',
        label: '가맹점 재료 코드',
        type: 'text' as const,
        required: true,
        placeholder: '점포 내 고유 코드',
      },
      {
        name: 'itemName',
        label: '품목명',
        type: 'text' as const,
        required: true,
      },
      {
        name: 'category',
        label: '카테고리',
        type: 'select' as const,
        required: true,
        options: [
          { value: 'MAIN', label: '주재료' },
          { value: 'SUB', label: '부재료' },
          { value: 'SAUCE', label: '소스/조미료' },
          { value: 'BEVERAGE', label: '음료' },
          { value: 'VEGETABLE', label: '채소' },
          { value: 'ETC', label: '기타' },
        ],
      },
      {
        name: 'baseUnit',
        label: '소진 단위',
        type: 'text' as const,
        required: true,
        placeholder: '개, g, 샷 등',
      },
      {
        name: 'salesUnit',
        label: '입고 단위',
        type: 'text' as const,
        required: true,
        placeholder: '박스, 봉, kg 등',
      },
      {
        name: 'conversionRate',
        label: '변환비율 (입고 → 소진)',
        type: 'number' as const,
        required: true,
        placeholder: '예: 1박스=1000g → 1000',
      },
      {
        name: 'optimalQuantity',
        label: '적정 재고 (소진 단위)',
        type: 'number' as const,
        required: false,
        placeholder: '예: 30',
      },
      {
        name: 'purchasePrice',
        label: '매입 단가 (입고 단위)',
        type: 'number' as const,
        required: false,
        placeholder: '예: 15000',
      },
      {
        name: 'supplier',
        label: '공급업체',
        type: 'text' as const,
        required: false,
        placeholder: '대표 공급업체명',
      },
      {
        name: 'temperature',
        label: '보관 온도',
        type: 'select' as const,
        required: false,
        options: [
          { value: 'TEMPERATURE', label: '상온' },
          { value: 'REFRIGERATE', label: '냉장' },
          { value: 'FREEZE', label: '냉동' },
        ],
      },
      {
        name: 'status',
        label: '재료 상태',
        type: 'select' as const,
        required: true,
        options: [
          { value: 'USE', label: '사용' },
          { value: 'STOP', label: '미사용' },
        ],
      },
    ];
  };

  const getModalTitle = () => {
    if (modalType === 'restock') return `${selectedItem?.name} 재입고`;
    if (modalType === 'adjust') return `${selectedItem?.name} 재고 조정`;
    if (modalType === 'order') return '새 발주 등록';
    return '새 자재 등록';
  };

  // 통계
  const totalItems = inventory.length;
  const lowStockItems = inventory.filter(i => i.status === 'low' || i.status === 'critical' || i.status === 'out').length;
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'approved').length;
  const expiringItems = inventory.filter(item => {
    const expiryDate = new Date(item.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  }).length;

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-gray mb-1">총 품목</p>
              <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
              <p className="text-xs text-dark-gray">재고 관리 품목</p>
            </div>
            <Package className="w-8 h-8 text-kpi-green" />
          </div>
        </Card>

        <Card className="p-6 bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-gray mb-1">재고 부족</p>
              <p className="text-2xl font-bold text-kpi-red">{lowStockItems}</p>
              <p className="text-xs text-dark-gray">조치 필요</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-kpi-red" />
          </div>
        </Card>

        <Card className="p-6 bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-gray mb-1">유통기한 임박</p>
              <p className="text-2xl font-bold text-kpi-orange">{expiringItems}</p>
              <p className="text-xs text-dark-gray">7일 이내 유통기한</p>
            </div>
            <Calendar className="w-8 h-8 text-kpi-orange" />
          </div>
        </Card>

        <Card className="p-6 bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-gray mb-1">처리 중 발주</p>
              <p className="text-2xl font-bold text-kpi-purple">{pendingOrders}</p>
              <p className="text-xs text-dark-gray">승인 대기/배송중</p>
            </div>
            <Truck className="w-8 h-8 text-kpi-purple" />
          </div>
        </Card>
      </div>

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">재고 관리</h2>
          <p className="text-sm text-dark-gray">재고 현황 및 관리</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleRegisterItem} variant="outline" className="border-kpi-green text-kpi-green hover:bg-green-50">
            <Plus className="w-4 h-4 mr-2" />자재 등록
          </Button>
          <Button onClick={handleOrder} variant="outline" className="border-kpi-orange text-kpi-orange hover:bg-orange-50">
            <Plus className="w-4 h-4 mr-2" />개별 발주
          </Button>
          <Button onClick={handleBulkOrder} className="bg-kpi-red hover:bg-red-600 text-white relative">
            <ShoppingCart className="w-4 h-4 mr-2" />
            발주 등록 {selectedItems.length > 0 && `(${selectedItems.length})`}
          </Button>
        </div>
      </div>

      {/* 부족 알림 */}
      {lowStockItems > 0 && (
        <Card className="p-6 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-kpi-red" />
            <div>
              <h3 className="font-semibold text-gray-900">재고 부족 알림</h3>
              <p className="text-sm text-dark-gray">{lowStockItems}개 품목의 재고가 부족합니다.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {inventory
              .filter(i => i.status === 'low' || i.status === 'critical' || i.status === 'out')
              .slice(0, 4)
              .map(item => (
                <Button
                  key={item.id}
                  onClick={() => handleRestock(item)}
                  variant="outline"
                  className="flex-col h-auto py-3 border-kpi-red text-kpi-red hover:bg-red-50"
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="text-xs">
                    {item.currentStock}/{item.minStock} {item.unit}
                  </span>
                </Button>
              ))}
          </div>
        </Card>
      )}

      {/* 테이블 */}
      <DataTable
        data={inventory}
        columns={inventoryColumns}
        title="재고 현황"
        searchPlaceholder="품목명, 카테고리, 위치로 검색"
        filters={inventoryFilters}
        showActions={false}
      />

      {/* 폼 모달 */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={getModalTitle()}
        fields={getFormFields()}
        onSubmit={handleSubmit}
        initialData={modalType === 'adjust' ? { newStock: selectedItem?.currentStock } : {}}
        isLoading={isLoading}
        maxWidth="md"
      />

      {/* 상세 모달 */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              재고 상세 정보
            </DialogTitle>
            <DialogDescription>선택한 재고 품목의 상세 정보를 확인하고 관리할 수 있습니다.</DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <ItemDetailContent
              item={selectedItem}
              onUpdateMinStock={handleUpdateMinStock}
              onRestock={() => {
                setIsDetailModalOpen(false);
                handleRestock(selectedItem);
              }}
              onAdjust={() => {
                setIsDetailModalOpen(false);
                handleAdjust(selectedItem);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 장바구니 모달 */}
      <Dialog open={isCartModalOpen} onOpenChange={setIsCartModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              발주 장바구니 ({cartItems.length}개 품목)
            </DialogTitle>
            <DialogDescription>선택한 품목들의 발주 정보를 확인하고 수정할 수 있습니다.</DialogDescription>
          </DialogHeader>

          {cartItems.length > 0 && (
            <OrderCartContent
              items={cartItems}
              onUpdateQuantity={(itemId, quantity) => {
                setCartItems(prev =>
                  prev.map(item => (item.id === itemId ? { ...item, orderQuantity: quantity, totalPrice: quantity * item.unitPrice } : item))
                );
              }}
              onRemoveItem={itemId => {
                setCartItems(prev => prev.filter(item => item.id !== itemId));
                setSelectedItems(prev => prev.filter(id => id !== itemId));
              }}
              onSubmitOrder={async ({ priority, notes }) => {
                try {
                  if (cartItems.length === 0) {
                    toast.error('발주 품목을 추가해주세요.');
                    return;
                  }
                  if (cartItems.some(ci => ci.orderQuantity <= 0)) {
                    toast.error('발주 수량을 확인해주세요.');
                    return;
                  }

                  // 1) DTO 구성
                  const dto: PurchaseOrderRequestsDTO = {
                    priority: (priority as 'NORMAL' | 'URGENT') ?? 'NORMAL',
                    notes: notes?.trim() || '',
                    items: cartItems.map(ci => ({
                      materialId: ci.id,       // ⚠️ InventoryItem.id가 StoreMaterial.id와 같다는 전제
                      count: ci.orderQuantity,
                    })),
                  };

                  // 2) 백엔드 호출
                  const res = await api.post<number>('/api/purchase/create', dto);

                  // 3) UX 업데이트
                  toast.success(`발주 등록 완료 #${res.data}`);
                  setIsCartModalOpen(false);
                  setSelectedItems([]);
                  setCartItems([]);

                  // 상단 카드(처리 중 발주) 숫자만 즉시 반영하고 싶으면 임시로 pending 추가
                  setOrders(prev => [
                    {
                      id: String(res.data),
                      items: cartItems.map(ci => ({ name: ci.name, quantity: ci.orderQuantity, unit: ci.unit, unitPrice: ci.unitPrice })),
                      supplier: (cartItems[0] as any)?.supplier ?? '미지정',
                      orderDate: new Date().toISOString().split('T')[0],
                      expectedDate: '', // 서버에서 관리
                      status: 'pending',
                      total: cartItems.reduce((s, ci) => s + ci.totalPrice, 0),
                    },
                    ...prev,
                  ]);
                } catch (e: any) {
                  console.error(e);
                  toast.error(e?.response?.data?.message || '발주 등록 중 오류가 발생했습니다.');
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {dialog}
    </div>
  );
}

/* =======================
   상세 / 장바구니 하위 컴포넌트
======================= */

function ItemDetailContent({
  item,
  onUpdateMinStock,
  onRestock,
  onAdjust
}: {
  item: InventoryItem;
  onUpdateMinStock: (minStock: number) => void;
  onRestock: () => void;
  onAdjust: () => void;
}) {
  const [editingMinStock, setEditingMinStock] = useState(false);
  const [minStockValue, setMinStockValue] = useState(item.minStock.toString());

  const handleSaveMinStock = () => {
    const newMinStock = parseInt(minStockValue, 10);
    if (isNaN(newMinStock) || newMinStock < 0) {
      toast.error('올바른 수량을 입력해주세요.');
      return;
    }
    onUpdateMinStock(newMinStock);
    setEditingMinStock(false);
  };

  const handleCancelEdit = () => {
    setMinStockValue(item.minStock.toString());
    setEditingMinStock(false);
  };

  const getStockStatus = () => {
    if (item.currentStock === 0) return { status: 'out', color: 'text-red-600', text: '품절' };
    if (item.currentStock <= item.minStock * 0.5) return { status: 'critical', color: 'text-red-600', text: '위험' };
    if (item.currentStock <= item.minStock) return { status: 'low', color: 'text-orange-600', text: '부족' };
    return { status: 'sufficient', color: 'text-green-600', text: '충분' };
  };

  const stockStatus = getStockStatus();
  const expiryDate = new Date(item.expiryDate);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.floor(item.currentStock / (item.weeklyUsage / 7));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-4">기본 정보</h3>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-gray-600">품목명</span><span className="font-medium">{item.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">카테고리</span><span>{item.category}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">보관위치</span><span>{item.location}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">공급업체</span><span>{item.supplier}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">단가</span><span>₩{(item.unitPrice || 0).toLocaleString()}/{item.unit}</span></div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-4">재고 현황</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">현재 재고</span>
              <span className={`font-semibold ${stockStatus.color}`}>{item.currentStock} {item.unit}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">재고 상태</span>
              <Badge className={
                stockStatus.status === 'sufficient' ? 'bg-green-100 text-green-800' :
                stockStatus.status === 'low' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
              }>
                {stockStatus.text}
              </Badge>
            </div>
            <div className="flex justify-between"><span className="text-gray-600">최대 재고</span><span>{item.maxStock} {item.unit}</span></div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">최소 재고</span>
              <div className="flex items-center gap-2">
                {editingMinStock ? (
                  <div className="flex items-center gap-2">
                    <Input value={minStockValue} onChange={(e) => setMinStockValue(e.target.value)} className="w-20 h-8 text-sm" type="number" min="0" />
                    <span className="text-sm text-gray-500">{item.unit}</span>
                    <Button size="sm" onClick={handleSaveMinStock} className="h-8 px-2">저장</Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-8 px-2">취소</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{item.minStock} {item.unit}</span>
                    <Button size="sm" variant="ghost" onClick={() => setEditingMinStock(true)} className="h-8 w-8 p-0">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-4">사용량 정보</h3>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-gray-600">주간 사용량</span><span>{item.weeklyUsage} {item.unit}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">일평균 사용량</span><span>{(item.weeklyUsage / 7).toFixed(1)} {item.unit}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">예상 소진일</span><span className={daysLeft <= 3 ? 'text-red-600 font-medium' : ''}>약 {daysLeft}일 후</span></div>
            <div className="flex justify-between"><span className="text-gray-600">마지막 입고</span><span>{new Date(item.lastRestocked).toLocaleDateString('ko-KR')}</span></div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-4">유통기한</h3>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-gray-600">유통기한</span><span>{expiryDate.toLocaleDateString('ko-KR')}</span></div>
            <div className="flex justify-between">
              <span className="text-gray-600">남은 기간</span>
              <span className={daysUntilExpiry <= 3 ? 'text-red-600 font-medium' : daysUntilExpiry <= 7 ? 'text-orange-600 font-medium' : ''}>
                {daysUntilExpiry <= 0 ? '기한만료' : `${daysUntilExpiry}일 남음`}
              </span>
            </div>
            <div className="flex justify-between"><span className="text-gray-600">재고 가치</span><span>₩{((item.currentStock || 0) * (item.unitPrice || 0)).toLocaleString()}</span></div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4">재고 레벨</h3>
        <div className="space-y-3">
          <div className="relative">
            <Progress value={(item.currentStock / item.maxStock) * 100} className="h-6" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {item.currentStock} / {item.maxStock} {item.unit}
              </span>
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>최소: {item.minStock}{item.unit}</span>
            <span>현재: {item.currentStock}{item.unit}</span>
            <span>최대: {item.maxStock}{item.unit}</span>
          </div>
        </div>
      </Card>

      <div className="flex gap-3 pt-4 border-t">
        <Button onClick={onRestock} className="bg-kpi-green hover:bg-green-600 text-white">
          <Plus className="w-4 h-4 mr-2" />재입고
        </Button>
        <Button onClick={onAdjust} variant="outline" className="border-kpi-orange text-kpi-orange hover:bg-orange-50">
          <Settings className="w-4 h-4 mr-2" />재고 조정
        </Button>
        {(item.status === 'low' || item.status === 'critical' || item.status === 'out') && (
          <Button variant="outline" className="border-kpi-red text-kpi-red hover:bg-red-50">
            <ShoppingCart className="w-4 h-4 mr-2" />발주 등록
          </Button>
        )}
      </div>
    </div>
  );
}

function OrderCartContent({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onSubmitOrder
}: {
  items: CartItem[];
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onRemoveItem: (itemId: number) => void;
  onSubmitOrder: (orderData: {
    supplier: string;
    expectedDate: string;
    priority: string;
    notes: string;
  }) => void;
}) {
  const [orderForm, setOrderForm] = useState<{ priority: string; notes: string }>({
    priority: 'NORMAL',
    notes: '',
  });

  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalItems = items.reduce((sum, item) => sum + item.orderQuantity, 0);

  const handleQuantityChange = (itemId: number, newQuantity: string) => {
    const quantity = parseInt(newQuantity, 10) || 0;
    if (quantity >= 0) onUpdateQuantity(itemId, quantity);
  };

  // 품목에서 공급업체 추론 (아이템에 supplier 속성이 있다고 가정)
  const inferSupplier = () => {
    if (items.length === 0) return '미지정';
    const first = (items[0] as any).supplier as string | undefined;
    const allSame =
      !!first && items.every((it) => (it as any).supplier === first);
    if (allSame && first) return first;
    const hasAny = items.some((it) => !!(it as any).supplier);
    return hasAny ? '여러 공급처' : '미지정';
  };

  const handleSubmit = () => {
    if (items.length === 0) {
      toast.error('발주 품목을 추가해주세요.');
      return;
    }
    if (items.some((item) => item.orderQuantity <= 0)) {
      toast.error('발주 수량을 확인해주세요.');
      return;
    }

    onSubmitOrder({
      supplier: inferSupplier(),   // 위에 정의한 보조 함수
      expectedDate: '',            // 입력 제거로 빈값 전달
      priority: orderForm.priority,
      notes: orderForm.notes,
    });
  }

  return (
    <div className="space-y-6">
      {/* 1) 발주 품목 (먼저 노출) */}
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">발주 품목 ({items.length}개)</h3>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <div className="mt-1 text-sm text-gray-500 space-y-1">
                      <div className="flex items-center gap-2">
                        <span>현재 재고:</span>
                        <span>{item.currentStock}{item.unit}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>적정 재고:</span>
                        <span>{item.minStock}{item.unit}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemoveItem(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-gray-600">수량:</Label>
                  <Input
                    type="number"
                    value={item.orderQuantity}
                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                    className="w-20 h-8 text-center"
                    min="0"
                  />
                  <span className="text-sm text-gray-600">{item.unit}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    단가: ₩{(item.unitPrice || 0).toLocaleString()}
                  </div>
                  <div className="font-medium text-gray-900">
                    ₩{(item.totalPrice || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 2) 발주 정보 (공급업체/납기일 입력 제거) */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4">발주 정보</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="priority">우선순위</Label>
            <select
              id="priority"
              value={orderForm.priority}
              onChange={(e) => setOrderForm((prev) => ({ ...prev, priority: e.target.value }))}
              className="mt-1 w-40 sm:w-48 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kpi-red"
            >
              <option value="NORMAL">일반</option>
              <option value="URGENT">우선</option>
            </select>
          </div>

          <div>
            <Label htmlFor="notes">특이사항</Label>
            <Input
              id="notes"
              value={orderForm.notes}
              onChange={(e) => setOrderForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="특별 요청사항이 있다면 입력하세요"
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* 3) 발주 요약 */}
      <Card className="p-4 bg-kpi-red/5 border-kpi-red/20">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">발주 요약</h3>
            <p className="text-sm text-gray-600">
              총 {items.length}개 품목, {(totalItems || 0).toLocaleString()}개
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">₩{(totalAmount || 0).toLocaleString()}</div>
            <div className="text-sm text-gray-600">총 발주 금액</div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-kpi-red/20">
          <Button
            variant="outline"
            onClick={() => setOrderForm({ priority: 'NORMAL', notes: '' })}
            className="flex-1"
          >
            초기화
          </Button>
          <Button onClick={handleSubmit} className="flex-1 bg-kpi-red hover:bg-red-600 text-white">
            <ShoppingCart className="w-4 h-4 mr-2" />
            발주 등록
          </Button>
        </div>
      </Card>
    </div>
  );
}
