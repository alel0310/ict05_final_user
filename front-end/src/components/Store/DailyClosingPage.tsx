import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import {
  Calculator,
  DollarSign,
  CreditCard,
  Gift,
  TrendingDown,
  Printer,
  CheckCircle,
  Banknote,
  AlertTriangle,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { KPICard } from "../Common/KPICard";
import { useOrder } from "../Common/OrderContext";
import { Label } from "../ui/label";

// 권종별 화폐
const denominations = [
  { value: 50000, name: "5만원권", type: "note", color: "text-yellow-600" },
  { value: 10000, name: "1만원권", type: "note", color: "text-green-600" },
  { value: 5000, name: "5천원권", type: "note", color: "text-red-600" },
  { value: 1000, name: "1천원권", type: "note", color: "text-blue-600" },
  { value: 500, name: "500원", type: "coin", color: "text-gray-600" },
  { value: 100, name: "100원", type: "coin", color: "text-gray-500" },
  { value: 50, name: "50원", type: "coin", color: "text-gray-400" },
  { value: 10, name: "10원", type: "coin", color: "text-gray-300" },
];

export function DailyClosingPage() {
  const { getTodayCashPayments, getTodayCardPayments } = useOrder();

  // [ 기본 데이터 ]
  const [cashPayments, setCashPayments] = useState(getTodayCashPayments());   // 현금 결제 내역
  const [cardPayments, setCardPayments] = useState(getTodayCardPayments());   // 카드 결제 내역
  const [refundAmount, setRefundAmount] = useState(10000);                    // 환불 금액
  const [discountAmount, setDiscountAmount] = useState(8000);                 // 할인 금액
  const [expenses, setExpenses] = useState([                                  // 지출 내역 목록
    { id: 1, description: "택배 착불", amount: 12000 },
    { id: 2, description: "청소용품 구매", amount: 23000 },
  ]);
  const [newExpense, setNewExpense] = useState({ description: "", amount: "" });  // 새 지출 항목 입력값
  const [depositAmount, setDepositAmount] = useState(0);                          // 은행 입금액
  const [isClosed, setIsClosed] = useState(false);                                // 마감 완료 여부
  const [differenceMemo, setDifferenceMemo] = useState("");

  // [ 시재 관련 ]
  const [startingCash, setStartingCash] = useState(200000);   // 시재 시작금
  const [denomCounts, setDenomCounts] = useState<Record<number, number>>({
    50000: 0, 10000: 0, 5000: 0, 1000: 0, 500: 0, 100: 0, 50: 0, 10: 0,
  });   // 권종별 시재 입력

  // [ 계산 ]
  const totalCash =                   // 현금·카드·상품권 매출 합산
    cashPayments.visitPayments +
    cashPayments.takeoutPayments +
    cashPayments.deliveryPayments;
  const totalCard =
    cardPayments.visitPayments +
    cardPayments.takeoutPayments +
    cardPayments.deliveryPayments;
  const totalVoucher = 15000;

  // 총 매출, 총 지출, 순매출 계산
  const totalSales = totalCash + totalCard + totalVoucher;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netSales = totalSales - discountAmount - refundAmount;

  // [ 시재 계산 ]
  // 실제 권종별 시재 총합 (실제 금고 안 현금)
  const actualCashFromCounts = denominations.reduce(
    (total, denom) => total + (denomCounts[denom.value] * denom.value),
    0
  );
  // 계산된(이론상) 시재 금액  
  // = 시작 시 금액 + 오늘 현금 매출 - 현금 지출 - 은행 입금액  
  // → 실제로 금고에 남아 있어야 하는 금액
  const calculatedCash = startingCash + totalCash - totalExpenses - depositAmount;
  // 차액 계산  
  // = 실제 금고 내 현금(권종 입력값 합계) - 계산된 시재 금액  
  // → 결과: 0이면 일치, +면 현금 과다, -면 현금 부족
  const difference = actualCashFromCounts - calculatedCash;
  const carryoverCash = calculatedCash; // 입금 후 이월 시재금(이론)

  // 이벤트
  const handleAddExpense = () => {
    if (isClosed) return; // 마감 후 입력 방지
    if (!newExpense.description || !newExpense.amount) {
      toast.error("지출 내역과 금액을 입력하세요.");
      return;
    }
    const expense = {
      id: Date.now(),
      description: newExpense.description,
      amount: parseInt(newExpense.amount),
    };
    setExpenses([...expenses, expense]);
    setNewExpense({ description: "", amount: "" });
    toast.success("지출 항목이 추가되었습니다.");
  };

  const handleRemoveExpense = (id: number) => {
    if (isClosed) return; // 마감 후 입력 방지
    setExpenses(expenses.filter((e) => e.id !== id));
  }

  const handleDenomCountChange = (value: number, count: number) => {
    if (isClosed) return; // 마감 후 입력 방지
    setDenomCounts((prev) => ({ ...prev, [value]: count }));
  };

  const handleCompleteClosing = () => {
    // 차액이 있을 때 메모 필수
    if (difference !== 0 && !differenceMemo.trim()) {
      toast.error("차액이 있을 경우 사유 메모를 입력해야 마감할 수 있습니다.");
      return;
    }
    setIsClosed(true);
    toast.success("일일 마감이 완료되었습니다.");
  };

  return (
    <div className="flex flex-col gap-14 pb-16">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">일일 시재/마감</h2>
          <p className="text-sm text-dark-gray">
            마감일자: {new Date().toLocaleDateString("ko-KR")}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            className="bg-kpi-green text-white gap-2"
            onClick={handleCompleteClosing}
            disabled={isClosed}
          >
            <CheckCircle className="w-4 h-4" /> 마감 완료
          </Button>
        </div>
      </div>

      {/* KPI 카드 */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <KPICard
            title="총 매출액"
            value={`₩${totalSales.toLocaleString()}`}
            icon={DollarSign}
            color="green"
            change={`순매출 ₩${netSales.toLocaleString()}`}
          />
          <KPICard
            title="결제 비율"
            value={`${((totalCash / totalSales) * 100).toFixed(1)}%`}
            icon={CreditCard}
            color="purple"
            change={`현금 ${(totalCash / totalSales * 100).toFixed(1)}% · 카드 ${(totalCard / totalSales * 100).toFixed(1)}%`}
          />
          <KPICard
            title="할인 / 환불"
            value={`₩${(discountAmount + refundAmount).toLocaleString()}`}
            icon={TrendingDown}
            color="orange"
            change={`할인 ₩${discountAmount.toLocaleString()} · 환불 ₩${refundAmount.toLocaleString()}`}
          />
        </div>
      </section>

      {/* 거래내역 탭 */}
      <section>
        <Tabs defaultValue="cash" className="pt-6">
          <TabsList>
            <TabsTrigger value="cash">현금</TabsTrigger>
            <TabsTrigger value="card">카드</TabsTrigger>
            <TabsTrigger value="voucher">상품권</TabsTrigger>
          </TabsList>

          {/* 현금 */}
          <TabsContent value="cash">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <DollarSign className="w-5 h-5 text-kpi-green" />
                  현금 거래
                </CardTitle>
              </CardHeader>
              <CardContent>
               <div className="grid grid-cols-3 text-center">
                  <div>방문: ₩{cardPayments.visitPayments.toLocaleString()}</div>
                  <div>포장: ₩{cardPayments.takeoutPayments.toLocaleString()}</div>
                  <div>배달: ₩{cardPayments.deliveryPayments.toLocaleString()}</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 카드 */}
          <TabsContent value="card">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  카드 거래
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 text-center">
                  <div>방문: ₩{cardPayments.visitPayments.toLocaleString()}</div>
                  <div>포장: ₩{cardPayments.takeoutPayments.toLocaleString()}</div>
                  <div>배달: ₩{cardPayments.deliveryPayments.toLocaleString()}</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 상품권 */}
          <TabsContent value="voucher">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Gift className="w-5 h-5 text-purple-600" />
                  상품권 거래
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>총액: ₩{totalVoucher.toLocaleString()}</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>  

      {/* 현금 지출 내역 */}
      <section className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <TrendingDown className="w-5 h-5 text-kpi-red" />
              현금 지출 내역
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-12 gap-2">
              <Input
                placeholder="지출 내역"
                value={newExpense.description}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, description: e.target.value })
                }
                className="col-span-6"
              />
              <Input
                type="number"
                placeholder="금액"
                value={newExpense.amount}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, amount: e.target.value })
                }
                className="col-span-4"
              />
              <Button
                onClick={handleAddExpense}
                className="col-span-2 bg-kpi-red text-white"
              >
                추가
              </Button>
            </div>

            {expenses.map((e) => (
              <div
                key={e.id}
                className="flex justify-between items-center bg-gray-50 p-3 rounded"
              >
                <span>{e.description}</span>
                <div className="flex items-center gap-2">
                  <span>₩{e.amount.toLocaleString()}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveExpense(e.id)}
                  >
                    삭제
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex justify-between border-t pt-3 font-semibold">
              <span>총 지출</span>
              <span>₩{totalExpenses.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 시재 요약 */}
      <section className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Calculator className="w-5 h-5 text-kpi-orange" />
              시작금(준비금) 입력
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="font-semibold">시작금(준비금)</Label>
                <Input
                  type="number"
                  value={startingCash}
                  onChange={(e) => setStartingCash(parseFloat(e.target.value) || 0)}
                  disabled={isClosed}
                />
              </div>

              <div className="space-y-2 text-gray-500">
                <Label>현금 매출</Label>
                <Input type="number" value={totalCash} readOnly />
              </div>

              <div className="space-y-2 text-gray-500">
                <Label>총 현금 지출</Label>
                <Input type="number" value={totalExpenses} readOnly />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      

      {/* 권종별 시재 입력 + 마감 요약 */}
      <section className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Banknote className="w-5 h-5 text-kpi-green" />
              권종별 시재 입력
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 지폐 */}
            <div>
              <h4 className="font-medium mb-3">지폐</h4>
              <div className="grid grid-cols-2 gap-4">
                {denominations.filter(d => d.type === "note").map(denom => (
                  <div key={denom.value} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className={`font-medium ${denom.color}`}>{denom.name}</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={denomCounts[denom.value] || ""}
                        onChange={(e) =>
                          handleDenomCountChange(denom.value, parseInt(e.target.value) || 0)
                        }
                        className="w-16 h-8"
                        disabled={isClosed}
                      />
                      <span className="text-xs text-gray-500">장</span>
                      <span className="text-xs text-gray-600 w-20 text-right">
                        ₩{((denomCounts[denom.value] || 0) * denom.value).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 동전 */}
            <div>
              <h4 className="font-medium mb-3">동전</h4>
              <div className="grid grid-cols-2 gap-4">
                {denominations.filter(d => d.type === "coin").map(denom => (
                  <div key={denom.value} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className={`font-medium ${denom.color}`}>{denom.name}</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={denomCounts[denom.value] || ""}
                        onChange={(e) =>
                          handleDenomCountChange(denom.value, parseInt(e.target.value) || 0)
                        }
                        className="w-16 h-8"
                        disabled={isClosed}
                      />
                      <span className="text-xs text-gray-500">개</span>
                      <span className="text-xs text-gray-600 w-20 text-right">
                        ₩{((denomCounts[denom.value] || 0) * denom.value).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 실제 시재 총액 */}
            <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center">
              <span className="font-medium text-blue-900">실제 시재 총액</span>
              <span className="font-bold text-lg text-blue-600">
                ₩{actualCashFromCounts.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 시재 마감 요약 */}
        <section className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Calculator className="w-5 h-5 text-kpi-orange" />
                시재 마감 요약
              </CardTitle>
            </CardHeader>

            <CardContent className="divide-y divide-gray-100">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">시작금(준비금)</span>
                <span className="font-semibold text-gray-800">
                  ₩{startingCash.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">현금 매출</span>
                <span className="font-semibold text-green-600">
                  ₩{totalCash.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">현금 지출</span>
                <span className="font-semibold text-gray-800">
                  ₩{totalExpenses.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">입금액</span>
                <Input
                  type="number"
                  className="w-28 text-right"
                  value={depositAmount}
                  onChange={(e) =>
                    setDepositAmount(parseFloat(e.target.value) || 0)
                  }
                  disabled={isClosed}
                />
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">실제 시재금</span>
                <span className="font-semibold text-blue-600">
                  ₩{actualCashFromCounts.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-t mt-3">
                <span className="font-semibold text-gray-700">차액</span>
                <span
                  className={`font-bold ${
                    difference === 0
                      ? "text-kpi-green"
                      : difference > 0
                      ? "text-blue-600"
                      : "text-kpi-red"
                  }`}
                >
                  {difference === 0
                    ? "일치"
                    : difference > 0
                    ? `+₩${difference.toLocaleString()}`
                    : `-₩${Math.abs(difference).toLocaleString()}`}
                </span>
              </div>

              {/* 차액 사유 메모 */}
              {difference !== 0 && (
                <div className="pt-3">
                  <Label className="text-sm text-gray-700 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-kpi-red" />
                    차액 사유 메모
                  </Label>
                  <textarea
                    className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kpi-orange"
                    rows={2}
                    value={differenceMemo}
                    onChange={(e) => setDifferenceMemo(e.target.value)}
                    placeholder="예: 현금 계산 실수로 보임, 오후 교대 시 재확인 예정"
                    disabled={isClosed}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    차액이 발생한 경우 사유를 간단히 기록해 주세요.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>  

      </section>
    </div>
  );
}
