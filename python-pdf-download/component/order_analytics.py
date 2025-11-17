# component/order_analytics.py
from io import BytesIO
from typing import Dict, Any, List

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

from .pdf_generator import PdfGenerator

_GEN = PdfGenerator()


def _headers(view_by: str) -> List[str]:
    """
    일별 / 월별에 따라 컬럼 헤더 정의
    """
    view_by = (view_by or "DAY").upper()
    if view_by == "MONTH":
        # 프론트 월별 테이블과 동일한 구조
        return ["월", "주문수", "총매출", "평균주문금액", "배달매출", "포장매출", "매장매출"]
    # DAY
    return ["날짜", "주문ID", "주문유형", "주문수", "매출액", "메뉴수", "결제수단", "채널메모"]


def _col_widths(view_by: str) -> List[float]:
    view_by = (view_by or "DAY").upper()
    if view_by == "MONTH":
        return [
            25 * mm,  # 월
            18 * mm,  # 주문수
            25 * mm,  # 총매출
            30 * mm,  # 평균주문금액
            25 * mm,  # 배달매출
            25 * mm,  # 포장매출
            25 * mm,  # 매장매출
        ]
    # DAY
    return [
        25 * mm,  # 날짜
        20 * mm,  # 주문ID
        18 * mm,  # 주문유형
        15 * mm,  # 주문수
        25 * mm,  # 매출액
        15 * mm,  # 메뉴수
        22 * mm,  # 결제수단
        40 * mm,  # 채널메모
    ]


def generate_orders_pdf(payload: Dict[str, Any]) -> bytes:
    styles = _GEN.styles

    criteria = payload.get("criteria") or {}
    rows: List[Dict[str, Any]] = payload.get("data") or []

    store_name = criteria.get("storeName", "")
    start = criteria.get("startDate", "")
    end = criteria.get("endDate", "")
    view_by = (criteria.get("viewBy") or "DAY").upper()
    gen_at = criteria.get("generatedAt", "") or ""  # option

    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=landscape(A4),
        leftMargin=10 * mm,
        rightMargin=10 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )

    story = []

    # ===== 제목 =====
    story.append(Paragraph("주문 분석 리포트", styles["TitleKR"]))
    story.append(Spacer(1, 3 * mm))

    # ===== 기본 정보 =====
    info = f"""기간: {start} ~ {end} / ViewBy: {view_by}<br/>
점포: {store_name}<br/>
생성일시: {gen_at}"""
    story.append(Paragraph(info, styles["BodyKR"]))
    story.append(Spacer(1, 6 * mm))

    # ===== 테이블 데이터 구성 =====
    headers = _headers(view_by)
    table_data: List[List[str]] = [headers]

    if view_by == "MONTH":
        # date, orderCount, totalSales, avgOrderAmount, deliverySales, takeoutSales, visitSales
        for r in rows:
            ym = r.get("date", "") or r.get("yearMonth", "")
            order_cnt = int(r.get("orderCount", 0))
            total_sales = int(r.get("totalSales", 0))
            avg_amount = int(r.get("avgOrderAmount", 0))
            delivery = int(r.get("deliverySales", 0))
            takeout = int(r.get("takeoutSales", 0))
            visit = int(r.get("visitSales", 0))

            table_data.append([
                ym,
                f"{order_cnt:,}",
                f"{total_sales:,}",
                f"{avg_amount:,}",
                f"{delivery:,}",
                f"{takeout:,}",
                f"{visit:,}",
            ])
    else:
        # DAY 모드: date, orderId, orderType, orderCount, totalPrice,
        #           menuCount, paymentType, channelMemo
        for r in rows:
            date = r.get("date", "")
            order_id = r.get("orderId", "")
            order_type = r.get("orderType", "")
            order_cnt = int(r.get("orderCount", 0))
            total_price = int(r.get("totalPrice", 0))
            menu_cnt = int(r.get("menuCount", 0))
            pay_type = r.get("paymentType", "") or "-"
            channel_memo = r.get("channelMemo", "") or "-"

            table_data.append([
                date,
                str(order_id),
                order_type,
                f"{order_cnt:,}",
                f"{total_price:,}",
                f"{menu_cnt:,}",
                pay_type,
                channel_memo,
            ])

    # 데이터가 하나도 없으면 빈 행 추가
    if len(table_data) == 1:
        table_data.append([""] * len(headers))

    table = Table(
        table_data,
        colWidths=_col_widths(view_by),
        repeatRows=1,
    )

    # ✅ 스타일 명령을 별도 리스트로 만들고, 조건부로 append
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F3F3F3")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CED4DA")),
        ("FONTNAME", (0, 0), (-1, 0), "KR-Bold"),
        ("FONTNAME", (0, 1), (-1, -1), "KR-Regular"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]

    # ✅ MONTH 모드일 때만 숫자열 우측 정렬 스타일 추가
    if view_by == "MONTH":
        style_cmds.append(("ALIGN", (1, 1), (-1, -1), "RIGHT"))

    table.setStyle(TableStyle(style_cmds))

    story.append(table)
    doc.build(story)
    return buf.getvalue()
