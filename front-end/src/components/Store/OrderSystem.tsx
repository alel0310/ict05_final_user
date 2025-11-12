// src/pages/OrderSystem.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { useOrder } from '../Common/OrderContext';
import {
  Plus,
  Minus,
  ShoppingCart,
  CreditCard,
  X,
  Store,
  Package,
  Truck,
  Gift,
  Percent,
} from 'lucide-react';
import { toast } from 'sonner';

/* ============================
   공통 axios 인스턴스
   (백엔드 URL은 .env에 맞춰져 있음)
============================ */
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_BASE_URL,
  withCredentials: true,
});

/* ============================
   타입 정의 (백엔드 DTO 가정)
============================ */

// 백엔드에서 내려오는 메뉴 한 줄 형태 예시
// 필요에 따라 필드명 맞춰서 수정하면 됨.
type SoldOutStatus = 'ON_SALE' | 'SOLD_OUT';

// interface StoreMenuDto {
//   menuId: number;
//   menuName: string;
//   menuPrice: number;
//   menuCategoryId: number;
//   menuCategoryName: string;
//   soldOutStatus: SoldOutStatus;
// }
export type StoreMenu = {
  menuId: number;
  menuName: string;
  menuNameEnglish: string;
  menuCategoryId: number;
  menuCategoryName: string;
  menuPrice: number;
  menuKcal: number;
  menuInformation: string;
  menuCode: string;
  ingredients: string;
  soldOutStatus: SoldOutStatus;
};
type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  // 필요하면 나머지도 추가
};

// 화면에서 쓰는 메뉴
interface MenuItem {
  id: number;
  name: string;
  price: number;
  image: string;
  available: boolean;
}

interface MenuCategoryWithItems {
  id: string;   // categoryId
  name: string; // categoryName
  items: MenuItem[];
}

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  options?: string[];
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  originalTotal: number;
  discount: number;
  status: 'preparing' | 'cooking' | 'ready' | 'completed';
  orderTime: Date | string;
  customer?: string;
  paymentMethod: string;
  orderType: '방문' | '포장' | '배달';
}

/* ============================
   유틸: 카테고리별 이모지
============================ */
const getEmojiForCategory = (categoryName: string) => {
  if (categoryName.includes('세트') || categoryName.includes('버거')) return '🍔';
  if (categoryName.includes('토스트')) return '🥪';
  if (categoryName.includes('사이드') || categoryName.includes('튀김')) return '🍟';
  if (categoryName.includes('음료') || categoryName.includes('콜라') || categoryName.includes('사이다')) return '🥤';
  return '🍔';
};

// TODO: 로그인한 가맹점 ID로 교체
const STORE_ID = 1;

export function OrderSystem() {
  const [menuCategories, setMenuCategories] = useState<MenuCategoryWithItems[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [orderType, setOrderType] = useState<'방문' | '포장' | '배달'>('방문');
  const [customerName, setCustomerName] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [paymentMethod, setPaymentMethod] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [customDiscountValue, setCustomDiscountValue] = useState('');
  const [orders, setOrders] = useState<Order[]>([]); // 화면에는 안 보이지만 주문번호 생성용

  // 일일 마감 Context
  const { addOrder } = useOrder();

  /* ============================
     시계
  ============================ */
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ============================
     메뉴 목록 DB에서 가져오기
  ============================ */
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        // ✅ 백엔드 응답은 Page 형태라고 가정
        const res = await api.get<PageResponse<StoreMenu>>('/API/menu/list');

        // 진짜 메뉴 배열은 여기
        const data = res.data.content;

        // 혹시 방어적으로 한 번 더
        if (!Array.isArray(data)) {
          console.error('메뉴 응답이 배열이 아닙니다:', res.data);
          toast.error('메뉴 응답 형식이 올바르지 않습니다.');
          return;
        }

        const categoryMap = new Map<string, MenuCategoryWithItems>();

        data.forEach((m) => {
          const catId = String(m.menuCategoryId);
          const catName = m.menuCategoryName;
          const emoji = getEmojiForCategory(catName);
          const available = m.soldOutStatus === 'ON_SALE';

          if (!categoryMap.has(catId)) {
            categoryMap.set(catId, {
              id: catId,
              name: catName,
              items: [],
            });
          }

          categoryMap.get(catId)!.items.push({
            id: m.menuId,
            name: m.menuName,
            price: m.menuPrice,
            image: emoji,
            available,
          });
        });

        const categoryList = Array.from(categoryMap.values());
        setMenuCategories(categoryList);
        if (categoryList.length > 0) {
          setSelectedCategory(categoryList[0].id);
        }
      } catch (error) {
        console.error('메뉴 조회 실패:', error);
        toast.error('메뉴를 불러오지 못했습니다.');
      }
    };

    fetchMenus();
  }, []);



  /* ============================
     localStorage 주문 히스토리 로드
     (주문번호 순서를 맞추기 위해 사용)
  ============================ */
  useEffect(() => {
    const existingOrders = localStorage.getItem('allOrders');
    if (existingOrders) {
      try {
        const storedOrders: Order[] = JSON.parse(existingOrders);
        setOrders(storedOrders);
      } catch (e) {
        console.error('주문 히스토리 파싱 오류:', e);
      }
    }
  }, []);

  /* ============================
     카트 관련 로직
  ============================ */
  const addToCart = (item: MenuItem | OrderItem) => {
    // 메뉴에서 온 객체인지, 이미 카트에 있는지 상관 없이 id/price/name/image만 맞으면 됨
    // (MenuItem에는 quantity가 없으니 기본 1개로 추가)
    const available = (item as MenuItem).available;
    if (available === false) {
      toast.error('품절된 상품입니다.');
      return;
    }

    const existingItem = cart.find((cartItem) => cartItem.id === item.id);
    if (existingItem) {
      setCart(
        cart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem,
        ),
      );
    } else {
      setCart([
        ...cart,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          image: item.image,
        },
      ]);
    }
    toast.success(`${item.name}이(가) 주문에 추가되었습니다.`);
  };

  const removeFromCart = (id: number) => {
    const existingItem = cart.find((item) => item.id === id);
    if (existingItem && existingItem.quantity > 1) {
      setCart(
        cart.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item,
        ),
      );
    } else {
      setCart(cart.filter((item) => item.id !== id));
    }
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    toast.info('주문이 초기화되었습니다.');
  };

  /* ============================
     금액 계산
  ============================ */
  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    if (discountType === 'percent') {
      return subtotal - (subtotal * discount) / 100;
    }
    return subtotal - discount;
  };

  /* ============================
     할인 적용
  ============================ */
  const applyDiscount = (amount: number, type: 'amount' | 'percent') => {
    setDiscount(amount);
    setDiscountType(type);
    toast.success(
      `할인이 적용되었습니다: ${
        type === 'percent' ? amount + '%' : amount.toLocaleString() + '원'
      }`,
    );
  };

  const removeDiscount = () => {
    setDiscount(0);
    toast.info('할인이 제거되었습니다.');
  };

  /* ============================
     결제 처리 + DB 저장
  ============================ */
  const processPayment = async (method: string) => {
    if (cart.length === 0) {
      toast.error('주문할 상품을 선택해주세요.');
      return;
    }

    try {
      // 1) 기존 주문 목록 불러오기 (localStorage)
      const existingOrders: Order[] = JSON.parse(
        localStorage.getItem('allOrders') || '[]',
      );
      const allExistingOrders = [...existingOrders, ...orders];

      let maxOrderNumber = 0;
      allExistingOrders.forEach((order) => {
        const num = parseInt(String(order.id).replace('#', ''), 10);
        if (!isNaN(num) && num > maxOrderNumber) {
          maxOrderNumber = num;
        }
      });

      const orderId = `#${String(maxOrderNumber + 1).padStart(4, '0')}`;

      const subtotal = calculateSubtotal();
      const total = calculateTotal();
      const discountAmount = subtotal - total;

      // 2) 백엔드에 주문 저장
      const orderTypeMapping: { [key: string]: 'visit' | 'takeout' | 'delivery' } =
        {
          방문: 'visit',
          포장: 'takeout',
          배달: 'delivery',
        };

      const paymentMethodMapping: {
        [key: string]: 'cash' | 'card' | 'voucher' | 'external';
      } = {
        현금: 'cash',
        카드: 'card',
        상품권: 'voucher',
      };

      const payload = {
        storeId: STORE_ID,
        orderCode: orderId, // CustomerOrder.orderCode
        orderType: orderTypeMapping[orderType], // 'visit' | ...
        paymentType: paymentMethodMapping[method] || 'cash',
        totalPrice: total,
        discount: discountAmount,
        customerName: customerName || null,
        items: cart.map((item) => ({
          menuId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
      };

      // TODO: 실제 주문 생성 API URL로 교체
      await api.post('/api/customer-orders', payload);

      // 3) 프론트 로컬/Context 업데이트 (일일 마감용)
      const newOrder: Order = {
        id: orderId,
        items: [...cart],
        total,
        originalTotal: subtotal,
        discount: discountAmount,
        status: 'preparing',
        orderTime: new Date(),
        customer: customerName || undefined,
        paymentMethod: method,
        orderType,
      };

      const updatedOrders = [newOrder, ...orders];
      setOrders(updatedOrders);

      const allUpdatedOrders = [newOrder, ...existingOrders];
      localStorage.setItem('allOrders', JSON.stringify(allUpdatedOrders));

      // Context에 주문 추가
      addOrder({
        items: cart.map((item) => ({
          id: String(item.id),
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          options: item.options,
        })),
        totalAmount: total,
        orderType: orderTypeMapping[orderType],
        paymentMethod: paymentMethodMapping[method] || 'cash',
        status: 'preparing',
      });

      setPaymentMethod(method);
      toast.success(`결제가 완료되었습니다. 주문번호: ${orderId}`);

      setTimeout(() => {
        toast.info('영수증이 출력되었습니다.');
      }, 1000);

      // 4) 폼 초기화
      setCart([]);
      setCustomerName('');
      setDiscount(0);
    } catch (error) {
      console.error('결제 처리/주문 저장 오류:', error);
      toast.error('결제 처리 중 오류가 발생했습니다.');
    }
  };

  /* ============================
     JSX
  ============================ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">주문 등록</h1>
          <p className="text-dark-gray mt-1">
            {currentTime.toLocaleString('ko-KR')} | {orderType} 주문
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 왼쪽: 메뉴 영역 */}
        <div className="col-span-8">
          {/* 카테고리 탭 */}
          <div className="flex gap-2 mb-4">
            {menuCategories.length === 0 ? (
              <span className="text-sm text-gray-500">
                표시할 메뉴가 없습니다. (백엔드 메뉴 API를 확인해주세요)
              </span>
            ) : (
              menuCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex-1"
                >
                  {category.name}
                </Button>
              ))
            )}
          </div>

          {/* 메뉴 카드 리스트 */}
          <div className="grid grid-cols-4 gap-4">
            {menuCategories
              .find((cat) => cat.id === selectedCategory)
              ?.items.map((item) => (
                <Card
                  key={item.id}
                  className={`p-4 cursor-pointer transition-all ${
                    item.available
                      ? 'hover:shadow-lg hover:scale-105'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => addToCart(item)}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">{item.image}</div>
                    <h3 className="font-medium mb-2">{item.name}</h3>
                    <div className="text-lg font-semibold text-kpi-red">
                      {item.price.toLocaleString()}원
                    </div>
                    {!item.available && (
                      <Badge variant="destructive" className="mt-2">
                        품절
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
          </div>
        </div>

        {/* 오른쪽: 주문 내역 */}
        <div className="col-span-4">
          <Card className="p-4 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                주문 내역
              </h3>
              {cart.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* 고객 정보 + 주문 형태 */}
            <div className="mb-4 space-y-2">
              <Input
                placeholder="고객명 (선택사항)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={orderType === '방문' ? 'default' : 'outline'}
                  onClick={() => setOrderType('방문')}
                  className="flex-1 flex items-center gap-1"
                >
                  <Store className="w-3 h-3" />
                  방문
                </Button>
                <Button
                  size="sm"
                  variant={orderType === '포장' ? 'default' : 'outline'}
                  onClick={() => setOrderType('포장')}
                  className="flex-1 flex items-center gap-1"
                >
                  <Package className="w-3 h-3" />
                  포장
                </Button>
                <Button
                  size="sm"
                  variant={orderType === '배달' ? 'default' : 'outline'}
                  onClick={() => setOrderType('배달')}
                  className="flex-1 flex items-center gap-1"
                >
                  <Truck className="w-3 h-3" />
                  배달
                </Button>
              </div>
            </div>

            {/* 카트 목록 */}
            <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>주문할 상품을 선택해주세요</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{item.image}</span>
                      <div>
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-gray-500">
                          {item.price.toLocaleString()}원
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFromCart(item.id)}
                        className="w-6 h-6 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="mx-2 min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addToCart(item)}
                        className="w-6 h-6 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 할인 섹션 */}
            {cart.length > 0 && (
              <div className="border-t pt-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="w-4 h-4" />
                  <span className="font-medium">% 할인</span>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={discountType === 'amount' ? 'default' : 'outline'}
                      onClick={() => setDiscountType('amount')}
                      className="flex-1"
                    >
                      할인 금액(원)
                    </Button>
                    <Button
                      size="sm"
                      variant={discountType === 'percent' ? 'default' : 'outline'}
                      onClick={() => setDiscountType('percent')}
                      className="flex-1"
                    >
                      할인율(%)
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder={
                        discountType === 'amount'
                          ? '할인 금액 입력'
                          : '할인율 입력 (1-100)'
                      }
                      value={customDiscountValue}
                      onChange={(e) => setCustomDiscountValue(e.target.value)}
                      className="flex-1"
                      type="number"
                      min="0"
                      max={discountType === 'percent' ? '100' : undefined}
                    />
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        const value = parseFloat(customDiscountValue);
                        if (value && value > 0) {
                          if (discountType === 'percent' && value > 100) {
                            toast.error('할인율은 100%를 초과할 수 없습니다.');
                            return;
                          }
                          applyDiscount(value, discountType);
                          setCustomDiscountValue('');
                        }
                      }}
                    >
                      할인적용
                    </Button>
                  </div>
                </div>

                {discount > 0 && (
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span>적용된 할인</span>
                    <div className="flex items-center gap-1">
                      <span className="text-red-600">
                        -
                        {discountType === 'percent'
                          ? discount + '%'
                          : discount.toLocaleString() + '원'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeDiscount}
                        className="w-4 h-4 p-0 text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 합계 */}
            {cart.length > 0 && (
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-dark-gray">소계</span>
                  <span className="text-sm">
                    {calculateSubtotal().toLocaleString()}원
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-dark-gray">할인</span>
                    <span className="text-sm text-red-600">
                      -
                      {(calculateSubtotal() - calculateTotal()).toLocaleString()}원
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                  <span>총액</span>
                  <span className="text-kpi-red">
                    {calculateTotal().toLocaleString()}원
                  </span>
                </div>
              </div>
            )}

            {/* 결제 버튼 */}
            {cart.length > 0 && (
              <div className="space-y-2 mt-4">
                <Button
                  onClick={() => processPayment('카드')}
                  className="w-full bg-kpi-red hover:bg-kpi-red/90 text-white"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  카드 결제
                </Button>
                <Button
                  onClick={() => processPayment('현금')}
                  variant="outline"
                  className="w-full"
                >
                  <Package className="w-4 h-4 mr-2" />
                  현금 결제
                </Button>
                <Button
                  onClick={() => processPayment('상품권')}
                  variant="outline"
                  className="w-full"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  상품권 결제
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
