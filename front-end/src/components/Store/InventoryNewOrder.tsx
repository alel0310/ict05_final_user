import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Package, Calculator } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';

export function InventoryNewOrder() {
  const [orderForm, setOrderForm] = useState({
    supplier: '',
    expectedDate: '',
    priority: 'normal',
    notes: ''
  });

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    quantity: 1,
    unit: 'kg',
    unitPrice: 0
  });

  // 샘플 재고 데이터 (자동완성용)
  const availableItems = [
    { name: '양파', category: '채소', unit: 'kg', unitPrice: 3000 },
    { name: '토마토', category: '채소', unit: 'kg', unitPrice: 5000 },
    { name: '소고기 등심', category: '육류', unit: 'kg', unitPrice: 35000 },
    { name: '치즈', category: '유제품', unit: 'kg', unitPrice: 12000 },
    { name: '밀가루', category: '제빵재료', unit: 'kg', unitPrice: 2500 }
  ];

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddItem = () => {
    if (!newItem.name || newItem.quantity <= 0 || newItem.unitPrice <= 0) {
      toast.error('모든 항목을 올바르게 입력해주세요.');
      return;
    }

    const item = {
      id: Date.now(),
      ...newItem,
      totalPrice: newItem.quantity * newItem.unitPrice
    };

    setCartItems(prev => [...prev, item]);
    setNewItem({
      name: '',
      category: '',
      quantity: 1,
      unit: 'kg',
      unitPrice: 0
    });
    setIsAddingItem(false);
    toast.success('품목이 추가되었습니다.');
  };

  const handleUpdateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) return;
    
    setCartItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.unitPrice }
        : item
    ));
  };

  const handleRemoveItem = (itemId: number) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
    toast.success('품목이 제거되었습니다.');
  };

  const handleItemSelect = (selectedItem: any) => {
    setNewItem(prev => ({
      ...prev,
      name: selectedItem.name,
      category: selectedItem.category,
      unit: selectedItem.unit,
      unitPrice: selectedItem.unitPrice
    }));
  };

  const handleSubmitOrder = () => {
    if (!orderForm.supplier || !orderForm.expectedDate) {
      toast.error('공급업체와 희망 납기일을 입력해주세요.');
      return;
    }
    
    if (cartItems.length === 0) {
      toast.error('발주할 품목을 추가해주세요.');
      return;
    }

    // 발주 제출 로직
    const orderData = {
      ...orderForm,
      items: cartItems,
      totalAmount,
      orderNumber: `ORD${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(Date.now()).slice(-3)}`,
      requestDate: new Date().toISOString().split('T')[0],
      status: 'pending'
    };

    console.log('발주 제출:', orderData);
    
    // 성공 후 폼 초기화
    setOrderForm({
      supplier: '',
      expectedDate: '',
      priority: 'normal',
      notes: ''
    });
    setCartItems([]);
    toast.success(`${cartItems.length}개 품목의 발주가 등록되었습니다.`);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">긴급</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">높음</Badge>;
      case 'normal':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">보통</Badge>;
      case 'low':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">낮음</Badge>;
      default:
        return <Badge variant="secondary">보통</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 발주 정보 입력 */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6" />
          새 발주 등록
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="supplier">공급업체 *</Label>
            <Input
              id="supplier"
              value={orderForm.supplier}
              onChange={(e) => setOrderForm(prev => ({ ...prev, supplier: e.target.value }))}
              placeholder="공급업체명을 입력하세요"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="expectedDate">희망 납기일 *</Label>
            <Input
              id="expectedDate"
              type="date"
              value={orderForm.expectedDate}
              onChange={(e) => setOrderForm(prev => ({ ...prev, expectedDate: e.target.value }))}
              className="mt-2"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <Label htmlFor="priority">우선순위</Label>
            <select
              id="priority"
              value={orderForm.priority}
              onChange={(e) => setOrderForm(prev => ({ ...prev, priority: e.target.value }))}
              className="mt-2 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kpi-red"
            >
              <option value="low">낮음</option>
              <option value="normal">보통</option>
              <option value="high">높음</option>
              <option value="urgent">긴급</option>
            </select>
          </div>
          <div>
            <Label htmlFor="notes">특이사항</Label>
            <Input
              id="notes"
              value={orderForm.notes}
              onChange={(e) => setOrderForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="특별 요청사항이 있다면 입력하세요"
              className="mt-2"
            />
          </div>
        </div>
      </Card>

      {/* 품목 추가 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">발주 품목 관리</h3>
          <Button 
            onClick={() => setIsAddingItem(true)}
            className="bg-kpi-green hover:bg-green-600 text-white"
            disabled={isAddingItem}
          >
            <Plus className="w-4 h-4 mr-2" />
            품목 추가
          </Button>
        </div>

        {/* 품목 추가 폼 */}
        {isAddingItem && (
          <Card className="p-4 mb-6 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label>품목명 *</Label>
                <Input
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="품목명"
                  className="mt-1"
                  list="item-suggestions"
                />
                <datalist id="item-suggestions">
                  {availableItems.map((item, index) => (
                    <option key={index} value={item.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label>카테고리</Label>
                <Input
                  value={newItem.category}
                  onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="카테고리"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>수량 *</Label>
                <Input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  min="1"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>단위</Label>
                <select
                  value={newItem.unit}
                  onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kpi-red"
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="개">개</option>
                  <option value="박스">박스</option>
                  <option value="포">포</option>
                </select>
              </div>
              <div>
                <Label>단가 *</Label>
                <Input
                  type="number"
                  value={newItem.unitPrice}
                  onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: parseInt(e.target.value) || 0 }))}
                  min="0"
                  className="mt-1"
                />
              </div>
            </div>
            
            {/* 자동완성 제안 */}
            {newItem.name && (
              <div className="mt-3">
                <p className="text-sm text-dark-gray mb-2">추천 품목:</p>
                <div className="flex gap-2 flex-wrap">
                  {availableItems
                    .filter(item => item.name.toLowerCase().includes(newItem.name.toLowerCase()))
                    .map((item, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant="outline"
                        onClick={() => handleItemSelect(item)}
                        className="text-xs"
                      >
                        {item.name} (₩{item.unitPrice.toLocaleString()}/{item.unit})
                      </Button>
                    ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-3 mt-4">
              <Button onClick={handleAddItem} className="bg-kpi-green hover:bg-green-600 text-white">
                추가
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddingItem(false);
                  setNewItem({
                    name: '',
                    category: '',
                    quantity: 1,
                    unit: 'kg',
                    unitPrice: 0
                  });
                }}
              >
                취소
              </Button>
            </div>
          </Card>
        )}

        {/* 장바구니 품목 목록 */}
        <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4" />
          발주 품목 목록 ({cartItems.length}개)
        </h4>
        {cartItems.length > 0 ? (
          <div className="space-y-3">
            {cartItems.map((item) => (
              <Card key={item.id} className="p-4 bg-white border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">{item.category}</p>
                        <p className="text-sm text-gray-500">단가: ₩{item.unitPrice.toLocaleString()}/{item.unit}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm text-gray-600 ml-2">{item.unit}</span>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-medium text-gray-900">₩{item.totalPrice.toLocaleString()}</div>
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>발주할 품목을 추가해주세요.</p>
          </div>
        )}
      </Card>

      {/* 발주 요약 및 제출 */}
      <Card className="p-6 bg-kpi-red/5 border-kpi-red/20">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              발주 요약
            </h3>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-gray-600">총 {cartItems.length}개 품목</p>
              <p className="text-gray-600">총 {totalItems}개</p>
              {orderForm.priority && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">우선순위:</span>
                  {getPriorityBadge(orderForm.priority)}
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">₩{totalAmount.toLocaleString()}</div>
            <div className="text-gray-600">총 발주 금액</div>
          </div>
        </div>
        
        <div className="flex gap-4 pt-6 border-t border-kpi-red/20">
          <Button 
            variant="outline" 
            onClick={() => {
              setOrderForm({ supplier: '', expectedDate: '', priority: 'normal', notes: '' });
              setCartItems([]);
            }}
            className="flex-1"
            disabled={cartItems.length === 0}
          >
            전체 초기화
          </Button>
          <Button 
            onClick={handleSubmitOrder}
            className="flex-2 bg-kpi-red hover:bg-red-600 text-white"
            disabled={cartItems.length === 0 || !orderForm.supplier || !orderForm.expectedDate}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            발주 등록 ({cartItems.length}개 품목)
          </Button>
        </div>
      </Card>
    </div>
  );
}