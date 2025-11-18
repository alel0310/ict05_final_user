// src/pages/KitchenDisplay.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Clock,
  User,
  ChefHat,
  Bell,
  CheckCircle,
  RefreshCw,
  Volume2,
  VolumeX,
  Settings,
  Zap,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';

// ========================
// 타입 정의
// ========================

type KitchenOrderStatus = 'preparing' | 'cooking' | 'ready' | 'completed';

interface KitchenOrderItemDTO {
  menuId: number;
  name: string;
  price: number; // BigDecimal -> number
  quantity: number;
  image: string | null;
  options?: string | null;
}

interface KitchenOrderResponseDTO {
  id: number;
  orderCode: string;
  items: KitchenOrderItemDTO[];
  total: number;
  originalTotal: number;
  discount: number;
  // "preparing" | "ready" | "completed"
  status: 'preparing' | 'ready' | 'completed';
  orderTime: string; // ISO 문자열
  customer: string | null;
  paymentMethod: string;
  orderType: '방문' | '포장' | '배달';
  priority: 'normal' | 'urgent' | null;
  notes: string | null;
}

interface OrderItem {
  menuId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  options?: string;
}

interface KitchenOrder {
  id: number;
  orderCode: string;
  items: OrderItem[];
  total: number;
  originalTotal: number;
  discount: number;
  status: KitchenOrderStatus;
  orderTime: Date;
  customer?: string;
  paymentMethod: string;
  orderType: '방문' | '포장' | '배달';
  priority?: 'normal' | 'urgent';
  notes?: string;
}

// ========================
// axios 인스턴스
// ========================

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_BASE_URL,
  withCredentials: true,
});

// 로그인한 가맹점 ID 로 교체
const STORE_ID = 1;

// ========================
// 컴포넌트
// ========================

export function KitchenDisplay() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);

  // DTO -> 화면용 매핑
  const mapDtoToOrder = (dto: KitchenOrderResponseDTO): KitchenOrder => {
    return {
      id: dto.id,
      orderCode: dto.orderCode,
      items: dto.items.map((i) => ({
        menuId: i.menuId,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.image || '🍔',
        options: i.options || undefined,
      })),
      total: dto.total,
      originalTotal: dto.originalTotal,
      discount: dto.discount,
      status: dto.status, // 서버는 preparing/ready/completed 만 내려줌
      orderTime: new Date(dto.orderTime),
      customer: dto.customer || undefined,
      paymentMethod: dto.paymentMethod,
      orderType: dto.orderType,
      priority: dto.priority || 'normal',
      notes: dto.notes || undefined,
    };
  };

  // 공통 정렬 함수
  const sortOrders = (list: KitchenOrder[]): KitchenOrder[] => {
    const statusOrder: Record<KitchenOrderStatus, number> = {
      cooking: 0,
      preparing: 1,
      ready: 2,
      completed: 3,
    };

    return [...list].sort((a, b) => {
      // urgent 우선
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;

      // 상태 우선순위
      const aStatus = statusOrder[a.status];
      const bStatus = statusOrder[b.status];
      if (aStatus !== bStatus) return aStatus - bStatus;

      // 주문 시간 오래된 순
      return a.orderTime.getTime() - b.orderTime.getTime();
    });
  };

  // 주문 목록 조회 (서버 + 기존 cooking 상태 유지)
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get<KitchenOrderResponseDTO[]>('/api/kitchen-orders', {
        params: { storeId: STORE_ID },
      });

      setOrders((prev) => {
        const prevMap = new Map<number, KitchenOrder>(
          prev.map((o) => [o.id, o]),
        );

        const merged = res.data.map((dto) => {
          const base = mapDtoToOrder(dto);
          const prevOrder = prevMap.get(base.id);

          // 이전에 프론트에서 cooking 이었는데
          // 서버는 아직 preparing 이라면 cooking 유지
          if (prevOrder && prevOrder.status === 'cooking' && base.status === 'preparing') {
            return { ...base, status: 'cooking' as KitchenOrderStatus };
          }

          return base;
        });

        return sortOrders(merged);
      });
    } catch (e) {
      console.error(e);
      toast.error('주방 주문 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 초기 로딩
  useEffect(() => {
    fetchOrders();
  }, []);

  // 시계
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 자동 새로고침
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchOrders();
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // 상태 변경 (조리 시작 / 조리 완료 / 픽업 완료)
  const updateOrderStatus = async (orderId: number, newStatus: KitchenOrderStatus) => {
    try {
      await api.patch(`/api/kitchen-orders/${orderId}/status`, {
        status: newStatus,
      });

      setOrders((prev) => {
        const updated = prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order,
        );

        // completed 는 리스트에서 제거
        if (newStatus === 'completed') {
          return updated.filter((o) => o.id !== orderId);
        }

        return sortOrders(updated);
      });

      if (soundEnabled && newStatus === 'ready') {
        toast.success(`주문 ${orderId} 조리 완료!`);
      }
      if (newStatus === 'completed') {
        toast.success(`주문 ${orderId} 픽업 완료`);
      }
    } catch (e) {
      console.error(e);
      toast.error('주문 상태 변경에 실패했습니다.');
    }
  };

  const completeOrder = (orderId: number) => {
    updateOrderStatus(orderId, 'completed');
  };

  // 경과 시간
  const getElapsedTime = (orderTime: Date) => {
    const elapsed = Math.floor((currentTime.getTime() - orderTime.getTime()) / 1000 / 60);
    return elapsed;
  };

  // 상태별 카운트
  const preparingCount = orders.filter((o) => o.status === 'preparing').length;
  const cookingCount = orders.filter((o) => o.status === 'cooking').length;
  const readyCount = orders.filter((o) => o.status === 'ready').length;

  // 상태 배지
  const getStatusBadge = (status: KitchenOrderStatus, priority?: string) => {
    const isPriority = priority === 'urgent';

    switch (status) {
      case 'preparing':
        return (
          <Badge
            className={`${
              isPriority ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-blue-100 text-blue-800'
            }`}
          >
            {isPriority && <Zap className="w-3 h-3 mr-1" />}
            준비중
          </Badge>
        );
      case 'cooking':
        return (
          <Badge
            className={`${
              isPriority ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-orange-100 text-orange-800'
            }`}
          >
            {isPriority && <Zap className="w-3 h-3 mr-1" />}
            조리중
          </Badge>
        );
      case 'ready':
        return (
          <Badge className="bg-green-100 text-green-800 animate-bounce">
            <Bell className="w-3 h-3 mr-1" />
            완료
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // 주문 유형 아이콘
  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case '방문':
        return '🏪';
      case '포장':
        return '🥡';
      case '배달':
        return '🚗';
      default:
        return '🏪';
    }
  };

  // ========================
  // JSX
  // ========================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-kpi-orange" />
            <h1>주방 화면</h1>
          </div>
          <div className="text-lg font-mono">{currentTime.toLocaleTimeString('ko-KR')}</div>
          {loading && <span className="text-sm text-gray-500">불러오는 중...</span>}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={soundEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>

          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          </Button>

          <Button variant="outline" size="sm" onClick={fetchOrders}>
            <Settings className="w-4 h-4 mr-1" />
            새로고침
          </Button>
        </div>
      </div>

      {/* 상태별 주문 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 준비중 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Package className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">준비중 ({preparingCount})</h3>
          </div>
          <div className="space-y-3">
            {orders
              .filter((order) => order.status === 'preparing')
              .map((order) => {
                const elapsedTime = getElapsedTime(order.orderTime);

                return (
                  <Card
                    key={order.id}
                    className={`p-4 ${
                      order.priority === 'urgent'
                        ? 'border-red-300 bg-red-50'
                        : 'border-blue-200 bg-blue-50'
                    }`}
                  >
                    {/* 헤더 */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getOrderTypeIcon(order.orderType)}</span>
                        <div>
                          <div className="font-semibold">{order.orderCode}</div>
                          <div className="text-sm text-gray-500">
                            {order.customer || '고객'} • {order.orderType}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(order.status, order.priority)}
                    </div>

                    {/* 정보 */}
                    <div className="flex items-center justify-between mb-3 p-2 bg-white rounded">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{elapsedTime}분 경과</span>
                      </div>
                    </div>

                    {/* 아이템 */}
                    <div className="space-y-2 mb-4">
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-white rounded border"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{item.image}</span>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              {item.options && (
                                <div className="text-sm text-gray-500">{item.options}</div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">x{item.quantity}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 버튼 */}
                    <Button
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      onClick={() => updateOrderStatus(order.id, 'cooking')}
                    >
                      <ChefHat className="w-4 h-4 mr-2" />
                      조리 시작
                    </Button>

                    {order.notes && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="text-sm text-yellow-800">📝 {order.notes}</div>
                      </div>
                    )}
                  </Card>
                );
              })}
            {preparingCount === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">준비중인 주문이 없습니다</p>
              </div>
            )}
          </div>
        </div>

        {/* 조리중 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
            <ChefHat className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-orange-800">조리중 ({cookingCount})</h3>
          </div>
          <div className="space-y-3">
            {orders
              .filter((order) => order.status === 'cooking')
              .map((order) => {
                const elapsedTime = getElapsedTime(order.orderTime);

                return (
                  <Card
                    key={order.id}
                    className={`p-4 ${
                      order.priority === 'urgent'
                        ? 'border-red-300 bg-red-50'
                        : 'border-orange-200 bg-orange-50'
                    }`}
                  >
                    {/* 헤더 */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getOrderTypeIcon(order.orderType)}</span>
                        <div>
                          <div className="font-semibold">{order.orderCode}</div>
                          <div className="text-sm text-gray-500">
                            {order.customer || '고객'} • {order.orderType}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(order.status, order.priority)}
                    </div>

                    {/* 정보 */}
                    <div className="flex items-center justify-between mb-3 p-2 bg-white rounded">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{elapsedTime}분 경과</span>
                      </div>
                    </div>

                    {/* 아이템 */}
                    <div className="space-y-2 mb-4">
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-white rounded border"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{item.image}</span>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              {item.options && (
                                <div className="text-sm text-gray-500">{item.options}</div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">x{item.quantity}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 버튼 */}
                    <Button
                      className="w-full bg-green-500 hover:bg-green-600"
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      조리 완료
                    </Button>

                    {order.notes && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="text-sm text-yellow-800">📝 {order.notes}</div>
                      </div>
                    )}
                  </Card>
                );
              })}
            {cookingCount === 0 && (
              <div className="text-center py-8 text-gray-500">
                <ChefHat className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">조리중인 주문이 없습니다</p>
              </div>
            )}
          </div>
        </div>

        {/* 완료 대기 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-800">완료 대기 ({readyCount})</h3>
          </div>
          <div className="space-y-3">
            {orders
              .filter((order) => order.status === 'ready')
              .map((order) => {
                const elapsedTime = getElapsedTime(order.orderTime);

                return (
                  <Card
                    key={order.id}
                    className="p-4 border-green-300 bg-green-50 animate-pulse"
                  >
                    {/* 헤더 */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getOrderTypeIcon(order.orderType)}</span>
                        <div>
                          <div className="font-semibold">{order.orderCode}</div>
                          <div className="text-sm text-gray-500">
                            {order.customer || '고객'} • {order.orderType}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(order.status, order.priority)}
                    </div>

                    {/* 정보 */}
                    <div className="flex items-center justify-between mb-3 p-2 bg-white rounded">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{elapsedTime}분 경과</span>
                      </div>
                      <Bell className="w-4 h-4 text-green-500 animate-bounce" />
                    </div>

                    {/* 아이템 */}
                    <div className="space-y-2 mb-4">
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-white rounded border"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{item.image}</span>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              {item.options && (
                                <div className="text-sm text-gray-500">{item.options}</div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">x{item.quantity}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 버튼 */}
                    <Button
                      className="w-full bg-gray-500 hover:bg-gray-600"
                      onClick={() => completeOrder(order.id)}
                    >
                      <User className="w-4 h-4 mr-2" />
                      픽업 완료
                    </Button>

                    {order.notes && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="text-sm text-yellow-800">📝 {order.notes}</div>
                      </div>
                    )}
                  </Card>
                );
              })}
            {readyCount === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">완료 대기중인 주문이 없습니다</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 주문 없음 */}
      {orders.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">조리할 주문이 없습니다</h3>
          <p className="text-gray-500">새로운 주문이 들어오면 여기에 표시됩니다.</p>
        </Card>
      )}
    </div>
  );
}
