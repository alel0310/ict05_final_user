# app.py
# uvicorn app:app --host 0.0.0.0 --port 8001 --reload

from fastapi import FastAPI, Response, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import logging

from component import kpi_analytics, order_analytics, time_day_report, menu_analytics

app = FastAPI(title="PDF Generation Service")
logger = logging.getLogger("pdf-service")

# =====================================================
#                   KPI (본사/가맹점 공통)
# =====================================================

class KpiRow(BaseModel):
    storeName: Optional[str] = None
    sales: Optional[float] = None
    transaction: Optional[int] = None
    upt: Optional[float] = None
    ads: Optional[float] = None
    aur: Optional[float] = None
    compMoM: Optional[float] = None
    compYoY: Optional[float] = None
    date: Optional[str] = None
    ratioVisit: Optional[float] = None
    ratioTakeout: Optional[float] = None
    ratioDelivery: Optional[float] = None

class KpiPayload(BaseModel):
    criteria: Dict[str, Any]
    data: List[KpiRow]


@app.post("/pdf/kpi-report", summary="KPI 분석 리포트 PDF 생성")
def create_kpi_report(payload: KpiPayload):
    pdf_bytes = kpi_analytics.generate_kpi_pdf(payload.dict())
    if not pdf_bytes:
        raise HTTPException(status_code=500, detail="Empty KPI PDF generated")
    return Response(content=pdf_bytes, media_type="application/pdf")


# =====================================================
#                   Orders (본사/가맹점 공통)
# =====================================================

class OrdersRow(BaseModel):
    # 공통/메타
    date: Optional[str] = None   # DAY: orderDate, MONTH: yearMonth
    yearMonth: Optional[str] = None  # 월별용 (백엔드에서 안 써도 혹시 대비)

    # DAY 뷰 (주문 단위)
    orderId: Optional[int] = None
    orderType: Optional[str] = None         # VISIT/TAKEOUT/DELIVERY
    orderCount: Optional[int] = 0           # 일별은 항상 1로 들어옴
    totalPrice: Optional[float] = 0         # 총금액
    menuCount: Optional[int] = 0
    paymentType: Optional[str] = None       # CARD/CASH/VOUCHER/EXTERNAL
    channelMemo: Optional[str] = None

    # MONTH 뷰 (월별 집계)
    totalSales: Optional[float] = 0         # 총매출
    orderCountMonth: Optional[int] = None   # 필요 없으면 사용 안 해도 됨
    avgOrderAmount: Optional[float] = 0
    deliverySales: Optional[float] = 0
    takeoutSales: Optional[float] = 0
    visitSales: Optional[float] = 0

    class Config:
        extra = "ignore"

class OrdersPayload(BaseModel):
    criteria: Dict[str, Any]
    data: List[OrdersRow]


@app.post("/pdf/orders", summary="주문 분석 리포트 PDF 생성")
def create_orders_report(payload: OrdersPayload):
    pdf_bytes = order_analytics.generate_orders_pdf(payload.dict())
    logger.info("orders.pdf length = %s bytes", 0 if not pdf_bytes else len(pdf_bytes))
    if not pdf_bytes:
        raise HTTPException(status_code=500, detail="Empty Orders PDF generated")
    return Response(content=pdf_bytes, media_type="application/pdf")


# =====================================================
#           시간·요일 분석 (가맹점 TimeDay 전용)
# =====================================================

class TimeDaySummary(BaseModel):
    peakHour: Optional[int] = None
    peakHourSales: int = 0
    offpeakHour: Optional[int] = None
    offpeakHourSales: int = 0
    topWeekday: Optional[int] = None
    topWeekdaySales: int = 0
    weekdaySales: int = 0
    weekendSales: int = 0


class TimeHourlyPoint(BaseModel):
    hour: int
    sales: int
    orders: int
    visitOrders: int
    takeoutOrders: int
    deliveryOrders: int


class WeekdaySalesPoint(BaseModel):
    weekday: int
    sales: int
    orders: int


class TimeDayDailyRow(BaseModel):
    orderDate: str
    weekday: int
    hour: int
    orderCount: int
    sales: int
    visitCount: int
    takeoutCount: int
    deliveryCount: int
    visitRate: float
    takeoutRate: float
    deliveryRate: float


# 🔹 월별 Row 추가
class TimeDayMonthlyRow(BaseModel):
    yearMonth: str
    weekday: int
    hour: int
    orderCount: int
    sales: int
    visitCount: int
    takeoutCount: int
    deliveryCount: int
    visitRate: float
    takeoutRate: float
    deliveryRate: float


class TimeDayReportPayload(BaseModel):
    storeId: int
    storeName: str
    periodLabel: str
    summary: TimeDaySummary
    hourlyPoints: List[TimeHourlyPoint] = Field(default_factory=list)
    weekdayPoints: List[WeekdaySalesPoint] = Field(default_factory=list)

    # 🔹 일/월 모드 & 테이블 데이터
    viewBy: str = "DAY"  # "DAY" or "MONTH"
    dailyRows: List[TimeDayDailyRow] = Field(default_factory=list)
    monthlyRows: List[TimeDayMonthlyRow] = Field(default_factory=list)

    generatedAt: str


@app.post("/pdf/time-day", summary="시간·요일 분석 리포트 PDF 생성 (가맹점)")
def create_time_report(payload: TimeDayReportPayload):
    # 새 테이블 기반 리포트 생성 함수 호출
    pdf_bytes = time_day_report.generate_time_day_pdf(payload.dict())

    if not pdf_bytes:
        raise HTTPException(status_code=500, detail="Empty Time-Day PDF generated")

    return Response(content=pdf_bytes, media_type="application/pdf")

# =====================================================
#                   Menus (본사/가맹점 공통)
# =====================================================

class MenuRow(BaseModel):
    date: Optional[str] = None
    storeName: Optional[str] = None
    category: Optional[str] = None
    menu: Optional[str] = None
    quantity: Optional[int] = 0
    sales: Optional[float] = 0
    orderCount: Optional[int] = 0

class MenuPayload(BaseModel):
    criteria: Dict[str, Any]
    data: List[MenuRow]



@app.post("/pdf/menus", summary="메뉴 분석 리포트 PDF 생성")
def create_menus_report(payload: MenuPayload):
    pdf_bytes = menu_analytics.generate_menus_pdf(payload.dict())
    if not pdf_bytes:
        raise HTTPException(status_code=500, detail="Empty Menus PDF generated")
    return Response(content=pdf_bytes, media_type="application/pdf")
