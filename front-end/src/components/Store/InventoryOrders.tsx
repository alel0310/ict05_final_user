import React, { useState, useEffect } from 'react';
import axios from "axios";
import { Truck, Search, Filter, Eye, CheckCircle, XCircle, Clock, AlertCircle, Package, Download } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { DataTable, Column } from '../Common/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { DownloadToggle } from '../Common/DownloadToggle';
import { toast } from 'sonner';

export function InventoryOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get("/api/purchase/list", {
        params: { page: 0, size: 10 },
         withCredentials: false, // 세션 안 쓸거면 false. 세션 쓰면 true + CORS 설정 필요
      });

      const data = res.data;
      console.log("✅ API 응답:", data); // <--- 무조건 추가

      const list = Array.isArray(data) ? data : data.content || [];
      const fetchedOrders = list.map((po: any) => ({
        id: po.id,
        orderCode: po.orderCode,
        supplier: po.supplier,
        orderDate: po.orderDate,
        actualDate: po.actualDeliveryDate,
        totalPrice: Number(po.totalPrice ?? 0),
        status: po.status,
        priority: po.priority,
        notes: po.remark || '',
        items: [
          {
            mainItemName: po.mainItemName ?? '-',
            quantity: po.itemCount ?? 0,
            unitPrice: 0,
            totalPrice: po.totalPrice ?? 0,
          },
        ],
      }));

      setOrders(fetchedOrders);
    } catch (error) {
      console.error("🚨 발주 목록 조회 실패:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">대기중</Badge>;
      case 'RECEIVED':
        return <Badge className="bg-green-100 text-green-800 border-green-200">접수됨</Badge>;
      case 'SHIPPING':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">배송중</Badge>;
      case 'DELIVERED':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">검수완료</Badge>;
      case 'CANCELED':
        return <Badge className="bg-red-100 text-red-800 border-red-100">취소됨</Badge>;
      default:
        return <Badge variant="secondary">알수없음</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge variant="destructive">우선</Badge>;
      case 'NORMAL':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">일반</Badge>;
      default:
        return <Badge variant="secondary">알수없음</Badge>;
    }
  };

  const filteredOrders = orders;

  const handleOrderDetail = (order: any) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleStatusChange = (orderId: number, newStatus: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { 
            ...order, 
            status: newStatus,
            actualDate: newStatus === 'DELIVERED' ? new Date().toISOString().split('T')[0] : order.actualDate
          }
        : order
    ));
    toast.success('발주 상태가 업데이트되었습니다.');
  };

  // 다운로드 기능
  const handleDownload = async (format: 'excel' | 'pdf') => {
    try {
      // 파일 생성 시뮬레이션을 위한 지연
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 데이터가 없는 경우 처리
      if (!orders || orders.length === 0) {
        throw new Error('다운로드할 발주 데이터가 없습니다.');
      }
      
      const exportData = orders.map(order => ({
        발주번호: order.orderCode || '-',
        공급업체: order.supplier || '-',
        발주일자: order.orderDate || '-',
        실제납기일자: order.actualDate || '-',
        발주상태: getStatusText(order.status),
        우선순위: getPriorityText(order.priority),
        총금액: `${(order.totalPrice || 0).toLocaleString()}원`,
        품목수: order.items ? order.items.length : 0,
        비고: order.notes || '-'
      }));

      if (format === 'excel') {
        const csvContent = [
          Object.keys(exportData[0]).join(','),
          ...exportData.map(row => Object.values(row).map(v => `"${v}"`).join(','))
        ].join('\n');
        
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `발주관리_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
      } else {
        // HTML 보고서 생성 (인쇄용)
        const reportWindow = window.open('', '_blank');
        const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>발주 관리 보고서</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
            padding: 40px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #14213D;
            padding-bottom: 20px;
        }
        
        .header h1 {
            color: #14213D;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .header-info {
            color: #666;
            font-size: 14px;
        }
        
        .summary {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 30px;
            border-left: 5px solid #F77F00;
        }
        
        .summary h2 {
            color: #14213D;
            font-size: 18px;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .summary-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .summary-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
        }
        
        .summary-value {
            font-size: 18px;
            font-weight: 600;
            color: #14213D;
        }
        
        .order-grid {
            display: grid;
            gap: 20px;
        }
        
        .order-card {
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        
        .order-header {
            background: linear-gradient(135deg, #14213D 0%, #1a2b4d 100%);
            color: white;
            padding: 16px 20px;
            font-weight: 600;
            font-size: 16px;
        }
        
        .order-content {
            padding: 20px;
        }
        
        .order-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .detail-item {
            display: flex;
            flex-direction: column;
        }
        
        .detail-label {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
            font-weight: 500;
        }
        
        .detail-value {
            font-size: 14px;
            color: #333;
            font-weight: 500;
        }
        
        .notes-section {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #9D4EDD;
            margin-top: 15px;
        }
        
        .notes-label {
            font-size: 12px;
            color: #666;
            font-weight: 600;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        
        .notes-content {
            font-size: 14px;
            color: #333;
            line-height: 1.5;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-completed { background: #d4edda; color: #155724; }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-cancelled { background: #f8d7da; color: #721c24; }
        
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
        
        @media print {
            body { padding: 20px; }
            .order-card { break-inside: avoid; }
            .header { break-after: avoid; }
        }
        
        @page {
            margin: 2cm;
            size: A4;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 발주 관리 보고서</h1>
        <div class="header-info">
            <div>생성일시: ${new Date().toLocaleString('ko-KR')}</div>
        </div>
    </div>
    
    <div class="summary">
        <h2>📊 보고서 요약</h2>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="summary-label">총 발주 건수</div>
                <div class="summary-value">${exportData.length}건</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">보고서 생성</div>
                <div class="summary-value">${new Date().toLocaleDateString('ko-KR')}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">생성 시간</div>
                <div class="summary-value">${new Date().toLocaleTimeString('ko-KR')}</div>
            </div>
        </div>
    </div>

    <div class="order-grid">
        ${exportData.map((order, index) => `
        <div class="order-card">
            <div class="order-header">
                #${index + 1} 발주번호: ${order.발주번호}
            </div>
            <div class="order-content">
                <div class="order-details">
                    <div class="detail-item">
                        <div class="detail-label">공급업체</div>
                        <div class="detail-value">${order.공급업체}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">발주일자</div>
                        <div class="detail-value">${order.발주일자}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">실제납기일자</div>
                        <div class="detail-value">${order.실제납기일자}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">발주상태</div>
                        <div class="detail-value">
                            <span class="status-badge ${
                              order.발주상태 === '검수완료'
                                ? 'status-completed'
                                : order.발주상태 === '대기중' || order.발주상태 === '접수됨' || order.발주상태 === '배송중'
                                ? 'status-pending'
                                : 'status-cancelled'
                            }">
                              ${order.발주상태}
                            </span>
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">우선순위</div>
                        <div class="detail-value">${order.우선순위}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">총금액</div>
                        <div class="detail-value">${order.총금액}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">품목수</div>
                        <div class="detail-value">${order.품목수}개</div>
                    </div>
                </div>
                ${order.비고 !== '-' ? `
                <div class="notes-section">
                    <div class="notes-label">비고</div>
                    <div class="notes-content">${order.비고}</div>
                </div>` : ''}
            </div>
        </div>
        `).join('')}
    </div>
    
    <div class="footer">
        <div>FranFriend ERP System - 발주 관리 보고서</div>
        <div>본 보고서는 ${new Date().toLocaleString('ko-KR')}에 자동 생성되었습니다.</div>
    </div>
    
    <script>
        window.onload = function() {
            setTimeout(() => {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>`;
        
        if (reportWindow) {
          reportWindow.document.write(htmlContent);
          reportWindow.document.close();
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  };

  // 상태 텍스트 변환
  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return '대기중';
      case 'RECEIVED': return '접수됨';
      case 'SHIPPING': return '배송중';
      case 'DELIVERED': return '검수완료';
      case 'CANCELED': return '취소';
      default: return '알수없음';
    }
  };

  // 우선순위 텍스트 변환
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'URGENT': return '우선';
      case 'NORMAL': return '일반';
      default: return '알수없음';
    }
  };

  const orderColumns: Column[] = [
    { 
      key: 'orderCode', 
      label: '발주번호', 
      sortable: true,
      render: (value, row) => (
        <div>
          <div 
            className="font-medium text-gray-900 cursor-pointer hover:text-kpi-red transition-colors"
            onClick={() => handleOrderDetail(row)}
          >
            {value}
          </div>
        </div>
      )
    },
    { 
      key: 'supplier', 
      label: '공급업체', 
      sortable: true,
      render: (value) => <span className="font-medium">{value}</span>
    },
    { 
      key: 'items', 
      label: '발주품목', 
      sortable: true,
      render: (items, row) => (
        <div>
          <div className="font-medium">{items[0]?.mainItemName}</div>
          {row.items[0]?.quantity > 1 && (
            <div className="text-xs text-dark-gray">
              외 {row.items[0].quantity - 1}개
            </div>
          )}
        </div>
      )
    },
    { 
      key: 'totalPrice', 
      label: '발주금액', 
      sortable: true,
      render: (value) => (
        <span className="font-medium">₩{(value || 0).toLocaleString()}</span>
      )
    },
    { 
      key: 'orderDate', 
      label: '발주주문일', 
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="text-sm">{value}</div>
        </div>
      )
    },
    { 
      key: 'actualDate', 
      label: '실제납기일', 
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="text-sm">{value ? value : '-'}</div>
        </div>
      )
    },
    { 
      key: 'priority', 
      label: '우선순위', 
      sortable: true,
      render: (value) => getPriorityBadge(value)
    },
    { 
      key: 'status', 
      label: '상태', 
      sortable: true,
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'actions',
      label: '작업',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => handleOrderDetail(row)}
          >
            <Eye className="w-3 h-3 mr-1" />
            상세
          </Button>
          {row.status === 'PENDING' && (
            <Button 
              size="sm" 
              className="bg-kpi-green hover:bg-green-600 text-white"
              onClick={() => handleStatusChange(row.id, 'RECEIVED')}
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              접수
            </Button>
          )}
        </div>
      )
    }
  ];

  // 발주 요약 통계
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.status === 'PENDING').length;
  const confirmedOrders = orders.filter(order => order.status === 'RECEIVED').length;
  const completedOrders = orders.filter(order => order.status === 'DELIVERED').length;

  return (
    <div className="space-y-6">
      {/* 발주 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-kpi-green text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">총 발주</p>
              <p className="text-2xl font-bold">{totalOrders}</p>
            </div>
            <Truck className="w-8 h-8 text-green-200" />
          </div>
        </Card>
        
        <Card className="p-6 bg-kpi-orange text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">대기중</p>
              <p className="text-2xl font-bold">{pendingOrders}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-200" />
          </div>
        </Card>
        
        <Card className="p-6 bg-kpi-purple text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">접수됨</p>
              <p className="text-2xl font-bold">{confirmedOrders}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-200" />
          </div>
        </Card>
        
        <Card className="p-6 bg-kpi-red text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">검수완료</p>
              <p className="text-2xl font-bold">{completedOrders}</p>
            </div>
            <Package className="w-8 h-8 text-red-200" />
          </div>
        </Card>
      </div>

      {/* 발주 내역 관리 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Truck className="w-5 h-5" />
            발주 내역 관리
          </h3>
          <div className="flex items-center gap-3">
            <DownloadToggle
              onDownload={handleDownload}
              filename={`발주관리_${new Date().toISOString().split('T')[0]}`}
            />
            <p className="text-sm text-dark-gray">💡 발주번호를 클릭하면 상세 정보를 확인할 수 있습니다</p>
          </div>
        </div>

        <DataTable
          columns={orderColumns}
          data={filteredOrders}
          title=""
          searchPlaceholder="발주번호, 공급업체, 품목명 검색"
          showActions={false}
          filters={[
            { label: '대기중', value: 'PENDING' },
            { label: '접수됨', value: 'RECEIVED' },
            { label: '배송중', value: 'SHIPPING' },
            { label: '검수완료', value: 'DELIVERED' },
            { label: '취소됨', value: 'CANCELED' }
          ]}
        />
      </Card>

      {/* 발주 상세 모달 */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              발주 상세 정보
            </DialogTitle>
            <DialogDescription>
              선택한 품목들의 발주 정보를 확인하고 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm text-dark-gray">발주번호</span>
                  <p className="font-medium">{selectedOrder.orderCode}</p>
                </div>
                <div>
                  <span className="text-sm text-dark-gray">공급업체</span>
                  <p className="font-medium">{selectedOrder.supplier}</p>
                </div>
                <div>
                  <span className="text-sm text-dark-gray">발주일</span>
                  <p className="font-medium">{selectedOrder.orderDate}</p>
                </div>
                <div>
                  <span className="text-sm text-dark-gray">실제납기일</span>
                  <p className="font-medium">{selectedOrder?.actualDate && selectedOrder.actualDate.trim() !== '' ? selectedOrder.actualDate : '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-dark-gray">우선순위</span>
                  <div>{getPriorityBadge(selectedOrder.priority)}</div>
                </div>
                <div>
                  <span className="text-sm text-dark-gray">상태</span>
                  <div>{getStatusBadge(selectedOrder.status)}</div>
                </div>
              </div>

              {/* 발주 품목 */}
              <div>
                <h3 className="font-semibold mb-3">발주 품목</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">품목명</th>
                        <th className="px-4 py-2 text-center">수량</th>
                        <th className="px-4 py-2 text-right">단가</th>
                        <th className="px-4 py-2 text-right">금액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item: any, index: number) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-3 font-medium">{item.mainItemName}</td>

                          <td className="px-4 py-3 text-center">
                            {isEditMode ? (
                              <Input
                                type="number"
                                value={item.itemCount}
                                onChange={(e) => {
                                  const newItemCount = parseInt(e.target.value) || 0;
                                  setSelectedOrder((prev: any) => ({
                                    ...prev,
                                    items: prev.items.map((it: any, i: number) =>
                                      i === index
                                        ? {
                                            ...it,
                                            itemCount: newItemCount,
                                            totalPrice: newItemCount * it.unitPrice,
                                          }
                                        : it
                                    ),
                                    totalPrice: prev.items.reduce(
                                      (sum: number, it: any, i: number) =>
                                        i === index
                                          ? sum + newItemCount * it.unitPrice
                                          : sum + it.totalPrice,
                                      0
                                    ),
                                  }));
                                }}
                                className="w-20 text-center"
                                min="1"
                              />
                            ) : (
                              <span>
                                {item.itemCount}
                                {item.unit}
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            ₩{item.unitPrice.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            ₩{item.totalPrice.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    <tfoot className="bg-gray-50 font-semibold">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right">
                          총 발주 금액:
                        </td>
                        <td className="px-4 py-3 text-right text-lg">
                          ₩{selectedOrder.totalPrice.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>


              <div>
                {/* 우선순위 */}
                <div>
                  <span className="text-sm text-dark-gray">우선순위</span>
                  {isEditMode ? (
                    <select
                      value={selectedOrder.priority}
                      onChange={(e) =>
                        setSelectedOrder({ ...selectedOrder, priority: e.target.value })
                      }
                      className="border rounded-md px-2 py-1 text-sm"
                    >
                      <option value="NORMAL">일반</option>
                      <option value="URGENT">우선</option>
                    </select>
                  ) : (
                    <div>{getPriorityBadge(selectedOrder.priority)}</div>
                  )}
                </div>

                {/* 특이사항 */}
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">특이사항</h3>
                  {isEditMode ? (
                    <textarea
                      value={selectedOrder.notes}
                      onChange={(e) =>
                        setSelectedOrder({ ...selectedOrder, notes: e.target.value })
                      }
                      className="w-full border rounded-lg p-2 text-sm"
                      rows={3}
                    />
                  ) : (
                    <p className="p-3 bg-gray-50 rounded-lg">{selectedOrder.notes || '-'}</p>
                  )}
                </div>
              </div>

              {/* 수정 / 저장 / 취소 버튼 */}
              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                {isEditMode ? (
                  <>
                    <Button
                      onClick={() => {
                        toast.success('발주 정보가 수정되었습니다.');
                        setIsEditMode(false);
                      }}
                      className="bg-kpi-green text-white hover:bg-green-600"
                    >
                      저장
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditMode(false)}
                    >
                      취소
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditMode(true)}
                  >
                    수정
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}