// src/pages/OrderList.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui/tabs';

import {
  Search,
  MapPin,
  XCircle,
  Package,
  Store,
  ShoppingBag,
  Car,
  Eye,
  MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';

/* =========================
   axios 공통 인스턴스
========================= */
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_BASE_URL,
  withCredentials: true,
});

/* =========================
   타입 정의
========================= */

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  options?: string[];
}

interface Order {
  id: string; // 화면에 보여줄 주문번호 (#0001)
  items: OrderItem[];
  total: number;
  originalTotal: number;
  discount: number;
  status: 'pending' | 'preparing' | 'cooking' | 'ready' | 'completed' | 'cancelled';
  orderTime: Date;
  customer?: string;
  paymentMethod: string;
  orderType: '방문' | '포장' | '배달';
  customerPhone?: string;
  deliveryAddress?: string;
  cancelReason?: string;
}

// 백엔드 응답은 필드명이 조금씩 다를 수 있으니 any로 받아서 매핑
type BackendOrder = any;

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all'); // ✅ 기본값 전체
  const [currentTab, setCurrentTab] = useState('all');

  /* =========================
     백엔드 → 화면 타입 매핑
  ========================= */

  const mapStatus = (statusRaw: string | undefined): Order['status'] => {
    const s = (statusRaw || '').toUpperCase();
    switch (s) {
      case 'PENDING':
        return 'pending';
      case 'PREPARING':
        return 'preparing';
      case 'COOKING':
        return 'cooking';
      case 'READY':
        return 'ready';
      case 'COMPLETED':
        return 'completed';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'cancelled';
      case 'PAID':
        return 'pending';
      default:
        return 'pending';
    }
  };

  const mapOrderType = (typeRaw: string | undefined): Order['orderType'] => {
    const t = (typeRaw || '').toUpperCase();
    switch (t) {
      case 'VISIT':
        return '방문';
      case 'TAKEOUT':
        return '포장';
      case 'DELIVERY':
        return '배달';
      default:
        return '방문';
    }
  };

  const mapPaymentMethod = (pRaw: string | undefined): string => {
    const p = (pRaw || '').toLowerCase();
    switch (p) {
      case 'card':
        return '카드결제';
      case 'cash':
        return '현금결제';
      case 'voucher':
        return '상품권결제';
      case 'external':
        return '외부결제';
      default:
        return pRaw || '-';
    }
  };

  const mapBackendOrderToOrder = (o: BackendOrder): Order => {
    // id / code
    const id: number | string = o.id ?? o.customerOrderId ?? 0;
    const orderCode: string =
      o.orderCode ??
      o.customerOrderCode ??
      `#${String(id).padStart(4, '0')}`;

    // 가격/할인
    const total = Number(o.totalPrice ?? o.customerOrderTotalPrice ?? 0);
    const discount = Number(o.discount ?? o.customerOrderDiscount ?? 0);

    // 상태 / 타입 / 결제
    const status = mapStatus(o.status ?? o.orderStatus ?? o.customerOrderStatus);
    const orderType = mapOrderType(o.orderType ?? o.customerOrderType);
    const paymentMethod = mapPaymentMethod(
      o.paymentType ?? o.customerOrderPaymentType,
    );

    // 날짜
    const dateStr =
      o.orderDate ??
      o.customerOrderDate ??
      o.createdAt ??
      new Date().toISOString();
    const orderTime = new Date(dateStr);

    // 고객 / 연락처 / 주소
    const customerName = o.customerName ?? o.memo ?? o.customer ?? null;
    const phone =
      o.customerPhone ??
      o.phone ??
      o.contact ??
      null;
    const address =
      o.deliveryAddress ??
      o.address ??
      null;

    // 현재는 주문 상세 API가 따로 없으니 빈 배열로
    const items: OrderItem[] = [];

    return {
      id: orderCode,
      items,
      total,
      originalTotal: total + discount,
      discount,
      status,
      orderTime,
      customer: customerName || undefined,
      paymentMethod,
      orderType,
      customerPhone: phone || undefined,
      deliveryAddress: address || undefined,
      cancelReason: undefined,
    };
  };

  /* =========================
     주문 목록 조회
  ========================= */

  const fetchOrders = async () => {
    try {
      const res = await api.get<BackendOrder[]>('/api/customer-orders');
      console.log('order list response:', res.data); // ✅ 응답 확인용

      const mapped = (res.data || []).map(mapBackendOrderToOrder);
      // 주문번호 기준 내림차순
      mapped.sort((a, b) => b.id.localeCompare(a.id));
      setOrders(mapped);
    } catch (error) {
      console.error('주문 목록 조회 오류:', error);
      toast.error('주문 목록을 불러오지 못했습니다.');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  /* =========================
     필터링 로직
  ========================= */

  useEffect(() => {
    let filtered = [...orders];

    // 검색어 필터
    if (searchTerm) {
      const keyword = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(keyword) ||
          order.customer?.toLowerCase().includes(keyword) ||
          order.customerPhone?.includes(searchTerm) ||
          order.items.some((item) =>
            item.name.toLowerCase().includes(keyword),
          ),
      );
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // 결제 방법 필터
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(
        (order) => order.paymentMethod === paymentFilter,
      );
    }

    // 주문 유형 필터
    if (orderTypeFilter !== 'all') {
      filtered = filtered.filter(
        (order) => order.orderType === orderTypeFilter,
      );
    }

    // 날짜 필터
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );

      if (dateFilter === 'today') {
        filtered = filtered.filter((order) => order.orderTime >= today);
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(
          today.getTime() - 7 * 24 * 60 * 60 * 1000,
        );
        filtered = filtered.filter((order) => order.orderTime >= weekAgo);
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(
          today.getTime() - 30 * 24 * 60 * 60 * 1000,
        );
        filtered = filtered.filter((order) => order.orderTime >= monthAgo);
      }
    }

    // 주문번호 내림차순
    filtered.sort((a, b) => b.id.localeCompare(a.id));

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter, paymentFilter, orderTypeFilter, dateFilter]);

  /* =========================
     유틸 함수들
  ========================= */

  const getOrderCountByStatus = (status: string) => {
    if (status === 'all') return orders.length;
    return orders.filter((order) => order.status === status).length;
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: '대기중', className: 'bg-yellow-100 text-yellow-800' },
      preparing: { label: '준비중', className: 'bg-blue-100 text-blue-800' },
      cooking: { label: '조리중', className: 'bg-orange-100 text-orange-800' },
      ready: { label: '완료', className: 'bg-green-100 text-green-800' },
      completed: { label: '픽업완료', className: 'bg-gray-100 text-gray-800' },
      cancelled: { label: '취소', className: 'bg-red-100 text-red-800' },
    };

    const config =
      statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case '방문':
        return <Store className="w-4 h-4" />;
      case '포장':
        return <ShoppingBag className="w-4 h-4" />;
      case '배달':
        return <Car className="w-4 h-4" />;
      default:
        return <Store className="w-4 h-4" />;
    }
  };

  // 지금은 화면에서만 상태 변경 (백엔드 연동 필요하면 PATCH 호출 추가)
  const updateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, status: newStatus as Order['status'] }
          : order,
      ),
    );
    toast.success(`주문 ${orderId} 상태가 ${newStatus}로 변경되었습니다.`);
  };

  const cancelOrder = (orderId: string, reason: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, status: 'cancelled', cancelReason: reason }
          : order,
      ),
    );
    toast.success(`주문 ${orderId}가 취소되었습니다.`);
  };

  const formatTime = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('ko-KR');
  };

  const formatDateTime = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleString('ko-KR');
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '주문접수';
      case 'preparing':
        return '준비중';
      case 'cooking':
        return '조리중';
      case 'ready':
        return '완료';
      case 'completed':
        return '픽업완료';
      case 'cancelled':
        return '취소';
      default:
        return '알수없음';
    }
  };

  const todayCount = orders.filter(
    (o) =>
      o.orderTime >= new Date(new Date().setHours(0, 0, 0, 0)),
  ).length;

  /* =========================
     JSX 렌더링
  ========================= */

  return (
    <div className="space-y-6">
      {/* Header (버튼 제거 버전) */}
      <div className="flex items-center justify-between">
        <div>
          <h1>주문 리스트</h1>
          <p className="text-dark-gray">
            오늘 총 {todayCount}건의 주문
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          {/* 검색 */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="주문번호, 고객명, 전화번호, 메뉴명으로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* 상태 필터 */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="pending">대기중</SelectItem>
              <SelectItem value="preparing">준비중</SelectItem>
              <SelectItem value="cooking">조리중</SelectItem>
              <SelectItem value="ready">완료</SelectItem>
              <SelectItem value="completed">픽업완료</SelectItem>
              <SelectItem value="cancelled">취소</SelectItem>
            </SelectContent>
          </Select>

          {/* 결제 방법 필터 */}
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="결제방법" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 결제</SelectItem>
              <SelectItem value="카드결제">카드결제</SelectItem>
              <SelectItem value="현금결제">현금결제</SelectItem>
              <SelectItem value="상품권결제">상품권결제</SelectItem>
            </SelectContent>
          </Select>

          {/* 주문 유형 필터 */}
          <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="주문유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 유형</SelectItem>
              <SelectItem value="방문">방문</SelectItem>
              <SelectItem value="포장">포장</SelectItem>
              <SelectItem value="배달">배달</SelectItem>
            </SelectContent>
          </Select>

          {/* 날짜 필터 */}
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="기간" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="today">오늘</SelectItem>
              <SelectItem value="week">일주일</SelectItem>
              <SelectItem value="month">한 달</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Orders Table */}
      <Card>
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="all">
              전체 ({getOrderCountByStatus('all')})
            </TabsTrigger>
            <TabsTrigger value="pending">
              대기 ({getOrderCountByStatus('pending')})
            </TabsTrigger>
            <TabsTrigger value="preparing">
              준비 ({getOrderCountByStatus('preparing')})
            </TabsTrigger>
            <TabsTrigger value="cooking">
              조리 ({getOrderCountByStatus('cooking')})
            </TabsTrigger>
            <TabsTrigger value="ready">
              완료 ({getOrderCountByStatus('ready')})
            </TabsTrigger>
            <TabsTrigger value="completed">
              픽업완료 ({getOrderCountByStatus('completed')})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              취소 ({getOrderCountByStatus('cancelled')})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={currentTab} className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                      주문번호
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                      주문시간
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                      고객정보
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                      주문내역
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                      유형
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                      금액
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                      결제
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                      상태
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders
                    .filter(
                      (order) =>
                        currentTab === 'all' || order.status === currentTab,
                    )
                    .map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {order.id}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-gray-900">
                              {formatTime(order.orderTime)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDate(order.orderTime)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-gray-900">
                              {order.customer || '고객'}
                            </div>
                            {order.customerPhone && (
                              <div className="text-sm text-gray-500">
                                {order.customerPhone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {order.items.slice(0, 2).map((item, index) => (
                              <div
                                key={index}
                                className="text-sm text-gray-900"
                              >
                                {item.name} x{item.quantity}
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <div className="text-sm text-gray-500">
                                외 {order.items.length - 2}개
                              </div>
                            )}
                            {order.items.length === 0 && (
                              <div className="text-sm text-gray-400">
                                (메뉴 정보 미연동)
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getOrderTypeIcon(order.orderType)}
                            <span className="text-gray-900">
                              {order.orderType}
                            </span>
                          </div>
                          {order.orderType === '배달' &&
                            order.deliveryAddress && (
                              <div className="text-sm text-gray-500 mt-1">
                                <MapPin className="w-3 h-3 inline mr-1" />
                                {order.deliveryAddress.slice(0, 20)}...
                              </div>
                            )}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-gray-900">
                              {(order.total || 0).toLocaleString()}원
                            </div>
                            {order.discount > 0 && (
                              <div className="text-sm text-red-500">
                                -{order.discount.toLocaleString()}원 할인
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-900">
                            {order.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            {getStatusBadge(order.status)}
                            {order.status === 'cancelled' &&
                              order.cancelReason && (
                                <div className="text-sm text-gray-500 mt-1">
                                  {order.cancelReason}
                                </div>
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            {order.status !== 'cancelled' &&
                              order.status !== 'completed' && (
                                <Select
                                  value={order.status}
                                  onValueChange={(value: any) =>
                                    updateOrderStatus(order.id, value)
                                  }
                                >
                                  <SelectTrigger className="h-8 w-8 p-0 border-none bg-transparent hover:bg-gray-100">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="preparing">
                                      준비중
                                    </SelectItem>
                                    <SelectItem value="cooking">
                                      조리중
                                    </SelectItem>
                                    <SelectItem value="ready">
                                      완료
                                    </SelectItem>
                                    <SelectItem value="completed">
                                      픽업완료
                                    </SelectItem>
                                    <SelectItem
                                      value="cancelled"
                                      onClick={() =>
                                        cancelOrder(order.id, '관리자 취소')
                                      }
                                    >
                                      취소
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {filteredOrders.filter(
              (order) =>
                currentTab === 'all' || order.status === currentTab,
            ).length === 0 && (
              <div className="text-center py-16">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  주문이 없습니다
                </h3>
                <p className="text-gray-500">
                  조건에 맞는 주문이 없습니다.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      {/* 상세 모달 */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2>주문 상세 정보</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrder(null)}
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">주문번호</label>
                    <p>{selectedOrder.id}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">주문시간</label>
                    <p>{formatDateTime(selectedOrder.orderTime)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">고객명</label>
                    <p>{selectedOrder.customer || '고객'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">연락처</label>
                    <p>{selectedOrder.customerPhone || '-'}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-500">주문 내역</label>
                  <div className="mt-2 space-y-2">
                    {selectedOrder.items.length === 0 && (
                      <div className="text-sm text-gray-400">
                        메뉴 상세는 아직 미연동 상태입니다.
                      </div>
                    )}
                    {selectedOrder.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <span>{item.image}</span>
                          <span>{item.name}</span>
                          <span className="text-gray-500">
                            x{item.quantity}
                          </span>
                        </div>
                        <span>
                          {(item.price * item.quantity).toLocaleString()}원
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span>소계</span>
                    <span>
                      {selectedOrder.originalTotal.toLocaleString()}원
                    </span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between items-center text-red-500">
                      <span>할인</span>
                      <span>
                        -{selectedOrder.discount.toLocaleString()}원
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-medium border-t mt-2 pt-2">
                    <span>총 결제금액</span>
                    <span>
                      {selectedOrder.total.toLocaleString()}원
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">결제방법</label>
                    <p>{selectedOrder.paymentMethod}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">주문유형</label>
                    <p>{selectedOrder.orderType}</p>
                  </div>
                </div>

                {selectedOrder.deliveryAddress && (
                  <div>
                    <label className="text-sm text-gray-500">배달주소</label>
                    <p>{selectedOrder.deliveryAddress}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm text-gray-500">주문상태</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
