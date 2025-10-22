import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useOrder } from '../Common/OrderContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Calculator, 
  DollarSign, 
  Wallet, 
  TrendingDown, 
  CheckCircle,
  AlertTriangle,
  Save,
  Printer,
  CreditCard,
  Gift,
  Banknote,
  Coins
} from 'lucide-react';
import { toast } from 'sonner';

// 샘플 지출 데이터

const sampleExpenses = [
  { id: 1, description: '거스름돈 부족으로 인한 교환', amount: 50000, time: '14:30' },
  { id: 2, description: '택배 착불 결제', amount: 15000, time: '16:45' },
  { id: 3, description: '부족한 재료 긴급 구매', amount: 80000, time: '18:20' },
];

// 권종별 화폐
const denominations = [
  { value: 50000, name: '5만원권', type: 'note', color: 'text-yellow-600' },
  { value: 10000, name: '1만원권', type: 'note', color: 'text-green-600' },
  { value: 5000, name: '5천원권', type: 'note', color: 'text-red-600' },
  { value: 1000, name: '1천원권', type: 'note', color: 'text-blue-600' },
  { value: 500, name: '500원', type: 'coin', color: 'text-gray-600' },
  { value: 100, name: '100원', type: 'coin', color: 'text-gray-500' },
  { value: 50, name: '50원', type: 'coin', color: 'text-gray-400' },
  { value: 10, name: '10원', type: 'coin', color: 'text-gray-300' },
];

// 상품권 종류
const voucherTypes = [
  { id: 'culture', name: '문화상품권', color: 'text-purple-600' },
  { id: 'book', name: '도서상품권', color: 'text-blue-600' },
  { id: 'department', name: '백화점상품권', color: 'text-pink-600' },
  { id: 'online', name: '온라인상품권', color: 'text-green-600' },
  { id: 'other', name: '기타상품권', color: 'text-gray-600' },
];

export function DailyClosing() {
  // Context에서 실제 현금/카드 결제 데이터 가져오기
  const { getTodayCashPayments, getTodayCardPayments } = useOrder();
  const [todayTransactions, setTodayTransactions] = useState(getTodayCashPayments());
  const [todayCardTransactions, setTodayCardTransactions] = useState(getTodayCardPayments());
  
  const [startingCash, setStartingCash] = useState(200000); // 영업 준비금
  const [expenses, setExpenses] = useState(sampleExpenses);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '' });
  const [isClosingComplete, setIsClosingComplete] = useState(false);

  // 실시간으로 현금/카드 결제 데이터 업데이트
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTodayTransactions(getTodayCashPayments());
      setTodayCardTransactions(getTodayCardPayments());
    }, 1000);

    return () => clearInterval(interval);
  }, [getTodayCashPayments, getTodayCardPayments]);
  
  // 권종별 현금 수량
  const [denomCounts, setDenomCounts] = useState<Record<number, number>>({
    50000: 0, 10000: 0, 5000: 0, 1000: 0,
    500: 0, 100: 0, 50: 0, 10: 0
  });

  // 상품권 입력
  const [vouchers, setVouchers] = useState<Record<string, number>>({
    culture: 0, book: 0, department: 0, online: 0, other: 0
  });

  // 계산된 값들
  const totalCashPayments = todayTransactions.visitPayments + todayTransactions.deliveryPayments + todayTransactions.takeoutPayments;
  const totalCardPayments = todayCardTransactions.visitPayments + todayCardTransactions.deliveryPayments + todayCardTransactions.takeoutPayments;
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const calculatedCash = startingCash + totalCashPayments - totalExpenses;
  
  // 권종별 계산된 현금 총액
  const actualCashFromCounts = denominations.reduce((total, denom) => {
    return total + (denomCounts[denom.value] * denom.value);
  }, 0);
  
  // 상품권 총액
  const totalVouchers = Object.values(vouchers).reduce((sum, amount) => sum + amount, 0);
  
  const difference = actualCashFromCounts - calculatedCash;

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount) {
      toast.error('지출 내역과 금액을 모두 입력해주세요.');
      return;
    }

    const expense = {
      id: Date.now(),
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };

    setExpenses([...expenses, expense]);
    setNewExpense({ description: '', amount: '' });
    toast.success('지출 내역이 추가되었습니다.');
  };

  const handleRemoveExpense = (id: number) => {
    setExpenses(expenses.filter(expense => expense.id !== id));
    toast.success('지출 내역이 삭제되었습니다.');
  };

  const handleDenomCountChange = (value: number, count: number) => {
    setDenomCounts(prev => ({
      ...prev,
      [value]: count
    }));
  };

  const handleVoucherChange = (type: string, amount: number) => {
    setVouchers(prev => ({
      ...prev,
      [type]: amount
    }));
  };

  const handleCompleteClosing = () => {
    if (actualCashFromCounts === 0) {
      toast.error('시재금을 권종별로 입력해주세요.');
      return;
    }

    if (Math.abs(difference) > 1000) {
      toast.error('시재 차액이 1000원을 초과합니다. 확인 후 다시 시도해주세요.');
      return;
    }

    setIsClosingComplete(true);
    toast.success('일일 마감이 완료되었습니다.');
  };

  const printClosingReport = () => {
    const reportData = {
      date: new Date().toLocaleDateString('ko-KR'),
      startingCash,
      cashPayments: totalCashPayments,
      expenses: totalExpenses,
      calculatedCash,
      actualCash: actualCashFromCounts,
      difference,
      vouchers,
      totalVouchers,
      denomCounts
    };
    
    console.log('마감보고서 데이터:', reportData);
    toast.success('마감 보고서를 출력합니다.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">일일 마감/시재</h2>
          <p className="text-sm text-dark-gray">
            오늘 ({new Date().toLocaleDateString('ko-KR')}) 현금 흐름 정리 및 시재 체크
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={printClosingReport}
            className="gap-2"
            disabled={!isClosingComplete}
          >
            <Printer className="w-4 h-4" />
            마감보고서 출력
          </Button>
          <Button 
            onClick={handleCompleteClosing}
            disabled={isClosingComplete || actualCashFromCounts === 0}
            className="bg-kpi-green hover:bg-green-600 text-white gap-2"
          >
            <Save className="w-4 h-4" />
            마감 완료
          </Button>
        </div>
      </div>

      {/* 마감 상태 */}
      {isClosingComplete && (
        <Card className="border-kpi-green bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-kpi-green" />
              <div>
                <h3 className="font-semibold text-kpi-green">마감이 완료되었습니다</h3>
                <p className="text-sm text-gray-600">
                  마감 시간: {new Date().toLocaleString('ko-KR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측: 현금 입출 내역 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 탭으로 구성된 입력 섹션 */}
          <Tabs defaultValue="cash-check" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="cash-check">시재 체크</TabsTrigger>
              <TabsTrigger value="vouchers">상품권</TabsTrigger>
              <TabsTrigger value="transactions">거래내역</TabsTrigger>
              <TabsTrigger value="expenses">지출내역</TabsTrigger>
            </TabsList>

            {/* 시재 체크 탭 */}
            <TabsContent value="cash-check" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-kpi-green" />
                    권종별 시재 체크
                  </CardTitle>
                  <p className="text-sm text-dark-gray">실제 보유 현금을 권종별로 입력해주세요</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 영업 준비금 */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label htmlFor="startingCash" className="text-sm font-medium mb-2 block">영업 준비금</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="startingCash"
                        type="number"
                        value={startingCash}
                        onChange={(e) => setStartingCash(parseFloat(e.target.value) || 0)}
                        className="w-32"
                        disabled={isClosingComplete}
                      />
                      <span className="text-sm text-dark-gray">원</span>
                    </div>
                  </div>

                  {/* 지폐 */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Banknote className="w-4 h-4 text-kpi-purple" />
                      <h4 className="font-medium">지폐</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {denominations.filter(d => d.type === 'note').map((denom) => (
                        <div key={denom.value} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${denom.color}`}>{denom.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={denomCounts[denom.value] || ''}
                              onChange={(e) => handleDenomCountChange(denom.value, parseInt(e.target.value) || 0)}
                              className="w-16 h-8"
                              disabled={isClosingComplete}
                              placeholder="0"
                            />
                            <span className="text-xs text-dark-gray w-12">장</span>
                            <span className="text-xs text-dark-gray w-20 text-right">
                              ₩{((denomCounts[denom.value] || 0) * denom.value).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 동전 */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Coins className="w-4 h-4 text-kpi-orange" />
                      <h4 className="font-medium">동전</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {denominations.filter(d => d.type === 'coin').map((denom) => (
                        <div key={denom.value} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${denom.color}`}>{denom.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={denomCounts[denom.value] || ''}
                              onChange={(e) => handleDenomCountChange(denom.value, parseInt(e.target.value) || 0)}
                              className="w-16 h-8"
                              disabled={isClosingComplete}
                              placeholder="0"
                            />
                            <span className="text-xs text-dark-gray w-12">개</span>
                            <span className="text-xs text-dark-gray w-20 text-right">
                              ₩{((denomCounts[denom.value] || 0) * denom.value).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 시재 총계 */}
                  <div className="border-t pt-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-blue-900">실제 시재 총액</span>
                        <span className="font-bold text-lg text-blue-600">
                          ₩{actualCashFromCounts.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 상품권 탭 */}
            <TabsContent value="vouchers" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-kpi-purple" />
                    받은 상품권
                  </CardTitle>
                  <p className="text-sm text-dark-gray">오늘 받은 상품권을 종류별로 입력해주세요</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {voucherTypes.map((voucher) => (
                    <div key={voucher.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CreditCard className={`w-4 h-4 ${voucher.color}`} />
                        <span className="font-medium">{voucher.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={vouchers[voucher.id] || ''}
                          onChange={(e) => handleVoucherChange(voucher.id, parseInt(e.target.value) || 0)}
                          className="w-24"
                          disabled={isClosingComplete}
                          placeholder="0"
                        />
                        <span className="text-sm text-dark-gray">원</span>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-purple-900">상품권 총액</span>
                        <span className="font-bold text-lg text-purple-600">
                          ₩{totalVouchers.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 거래내역 탭 */}
            <TabsContent value="transactions" className="mt-6">

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-kpi-green" />
                    현금 수입
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-dark-gray mb-1">방문 현금결제</p>
                      <p className="font-bold text-lg">₩{todayTransactions.visitPayments.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-dark-gray mb-1">배달 현금결제</p>
                      <p className="font-bold text-lg">₩{todayTransactions.deliveryPayments.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-dark-gray mb-1">포장 현금결제</p>
                      <p className="font-bold text-lg">₩{todayTransactions.takeoutPayments.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">현금 수입 총계</span>
                      <span className="font-bold text-lg text-kpi-green">
                        ₩{totalCashPayments.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 지출내역 탭 */}
            <TabsContent value="expenses" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-kpi-red" />
                    현금 지출
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 지출 내역 추가 */}
                  <div className="grid grid-cols-12 gap-2">
                    <Input
                      placeholder="지출 내역"
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                      className="col-span-6"
                      disabled={isClosingComplete}
                    />
                    <Input
                      type="number"
                      placeholder="금액"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                      className="col-span-4"
                      disabled={isClosingComplete}
                    />
                    <Button 
                      onClick={handleAddExpense}
                      disabled={isClosingComplete}
                      className="col-span-2 bg-kpi-red hover:bg-red-600 text-white"
                    >
                      추가
                    </Button>
                  </div>

                  {/* 지출 내역 목록 */}
                  <div className="space-y-2">
                    {expenses.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{expense.description}</p>
                          <p className="text-xs text-dark-gray">{expense.time}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-kpi-red">₩{expense.amount.toLocaleString()}</span>
                          {!isClosingComplete && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveExpense(expense.id)}
                              className="text-kpi-red border-kpi-red hover:bg-red-50"
                            >
                              삭제
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">현금 지출 총계</span>
                      <span className="font-bold text-lg text-kpi-red">
                        ₩{totalExpenses.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* 우측: 마감 시재 계산 및 요약 */}
        <div className="space-y-6">
          {/* 계산된 시재 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-kpi-orange" />
                계산된 시재
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-gray">영업 준비금</span>
                  <span>₩{startingCash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-gray">현금 수입</span>
                  <span className="text-kpi-green">+₩{totalCashPayments.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-gray">현금 지출</span>
                  <span className="text-kpi-red">-₩{totalExpenses.toLocaleString()}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">계산된 시재</span>
                    <span className="font-bold text-lg text-kpi-orange">
                      ₩{calculatedCash.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 시재 대조 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-kpi-green" />
                시재 대조
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-dark-gray">계산된 시재</span>
                  <span>₩{calculatedCash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-gray">실제 시재</span>
                  <span className={actualCashFromCounts > 0 ? 'text-blue-600 font-medium' : 'text-gray-400'}>
                    ₩{actualCashFromCounts.toLocaleString()}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">차액</span>
                    <div className="flex items-center gap-2">
                      {actualCashFromCounts === 0 ? (
                        <span className="text-gray-400">미입력</span>
                      ) : Math.abs(difference) <= 100 ? (
                        <CheckCircle className="w-4 h-4 text-kpi-green" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-kpi-red" />
                      )}
                      <span className={`font-bold ${
                        actualCashFromCounts === 0 ? 'text-gray-400' :
                        difference === 0 ? 'text-kpi-green' :
                        difference > 0 ? 'text-blue-600' : 'text-kpi-red'
                      }`}>
                        {actualCashFromCounts === 0 ? '-' :
                         difference === 0 ? '일치' :
                         difference > 0 ? `+₩${difference.toLocaleString()}` :
                         `-₩${Math.abs(difference).toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                </div>

                {actualCashFromCounts > 0 && Math.abs(difference) > 100 && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-kpi-orange" />
                      <span className="font-medium text-kpi-orange">차액 발생</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {difference > 0 ? 
                        '실제 시재가 계산보다 많습니다. 미기록 수입이 있는지 확인해주세요.' :
                        '실제 시재가 계산보다 적습니다. 미기록 지출이 있는지 확인해주세요.'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 상품권 요약 */}
          {totalVouchers > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-kpi-purple" />
                  상품권 요약
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {voucherTypes.filter(v => vouchers[v.id] > 0).map((voucher) => (
                  <div key={voucher.id} className="flex justify-between text-sm">
                    <span className="text-dark-gray">{voucher.name}</span>
                    <span>₩{vouchers[voucher.id].toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">상품권 총액</span>
                    <span className="font-bold text-lg text-kpi-purple">
                      ₩{totalVouchers.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 최종 마감 요약 */}
          <Card className={isClosingComplete ? 'border-kpi-green bg-green-50' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isClosingComplete ? (
                  <CheckCircle className="w-5 h-5 text-kpi-green" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-kpi-orange" />
                )}
                최종 마감 요약
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-gray">마감 일시</span>
                  <span>{new Date().toLocaleDateString('ko-KR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-gray">총 현금 거래</span>
                  <span>₩{totalCashPayments.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-gray">총 카드 거래</span>
                  <span className="text-blue-600">₩{totalCardPayments.toLocaleString()}</span>
                </div>
                <div className="pl-4 space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>• 방문 카드결제</span>
                    <span>₩{todayCardTransactions.visitPayments.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• 포장 카드결제</span>
                    <span>₩{todayCardTransactions.takeoutPayments.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• 배달 카드결제</span>
                    <span>₩{todayCardTransactions.deliveryPayments.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-gray">총 현금 지출</span>
                  <span>₩{totalExpenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-gray">상품권 총액</span>
                  <span>₩{totalVouchers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-3 bg-gray-50 -mx-6 px-6 py-3">
                  <span className="text-dark-gray">전체 매출 총액</span>
                  <span className="text-lg text-kpi-green">₩{(totalCashPayments + totalCardPayments + totalVouchers).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-gray">시재 차액</span>
                  <span className={`${
                    actualCashFromCounts === 0 ? 'text-gray-400' :
                    Math.abs(difference) <= 100 ? 'text-kpi-green' : 'text-kpi-red'
                  }`}>
                    {actualCashFromCounts === 0 ? '미입력' :
                     Math.abs(difference) <= 100 ? '정상' : `₩${Math.abs(difference).toLocaleString()} 차액`}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-dark-gray">마감 상태</span>
                  <Badge className={isClosingComplete ? 'bg-kpi-green text-white' : 'bg-gray-200 text-gray-600'}>
                    {isClosingComplete ? '완료' : '진행중'}
                  </Badge>
                </div>
                
                {isClosingComplete && (
                  <div className="bg-kpi-green/10 p-3 rounded-lg mt-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-kpi-green" />
                      <span className="font-medium text-kpi-green">마감이 완료되었습니다</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      마감 시간: {new Date().toLocaleString('ko-KR')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}