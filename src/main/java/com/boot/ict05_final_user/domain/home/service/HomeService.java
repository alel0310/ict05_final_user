package com.boot.ict05_final_user.domain.home.service;

import com.boot.ict05_final_user.domain.home.dto.*;
import com.boot.ict05_final_user.domain.home.repository.HomeRepositoryCustom;
import com.boot.ict05_final_user.domain.order.entity.OrderStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class HomeService {

    private final HomeRepositoryCustom homeRepositoryCustom;

    private static LocalDateTime s(LocalDate d) { return d.atStartOfDay(); }
    private static LocalDateTime e(LocalDate d) { return d.plusDays(1).atStartOfDay(); }
    private static final List<OrderStatus> DONE = List.of(OrderStatus.PAID, OrderStatus.COMPLETED);

    public KpiCardsResponseDTO getTodayKpis(Long storeId) {
        LocalDate today = LocalDate.now();
        LocalDateTime ts = s(today), te = e(today);
        LocalDateTime ys = s(today.minusDays(1)), ye = e(today.minusDays(1));

        BigDecimal sales = homeRepositoryCustom.sumSales(ts, te, storeId, DONE);
        long orders = homeRepositoryCustom.countOrders(ts, te, storeId, DONE);
        long visitors = homeRepositoryCustom.countVisitOrders(ts, te, storeId, DONE);

        BigDecimal salesPrev = homeRepositoryCustom.sumSales(ys, ye, storeId, DONE);
        long ordersPrev = homeRepositoryCustom.countOrders(ys, ye, storeId, DONE);
        long visitorsPrev = homeRepositoryCustom.countVisitOrders(ys, ye, storeId, DONE);

        var cards = List.of(
                KpiCardDTO.builder()
                        .key("sales_today")
                        .value(formatWon(sales))
                        .change(diffPctStr(sales, salesPrev))
                        .changeType(changeType(sales, salesPrev))
                        .build(),
                KpiCardDTO.builder()
                        .key("orders_today")
                        .value(orders + "건")
                        .change(diffPctStr(orders, ordersPrev))
                        .changeType(changeType(orders, ordersPrev))
                        .build(),
                KpiCardDTO.builder()
                        .key("visitors_today")
                        .value(visitors + "명")
                        .change(diffPctStr(visitors, visitorsPrev))
                        .changeType(changeType(visitors, visitorsPrev))
                        .build(),
                KpiCardDTO.builder()
                        .key("top_menu")
                        .value(findTopMenuName(ts, te, storeId))
                        .change(findTopMenuQty(ts, te, storeId))
                        .changeType(ChangeType.NEUTRAL)
                        .build()
        );

        return KpiCardsResponseDTO.builder()
                .date(LocalDateTime.now())
                .storeId(storeId)
                .cards(cards)
                .build();
    }

    public TopMenusResponseDTO getTopMenus(Long storeId, int limit) {
        LocalDate today = LocalDate.now();
        LocalDateTime ts = s(today), te = e(today);

        var rows = homeRepositoryCustom.findTopMenus(ts, te, storeId, limit, DONE);
        var items = rows.stream()
                .map(r -> TopMenuItemDTO.builder()
                        .menuId(r.menuId())
                        .name(r.name())
                        .quantity((int) r.qty())
                        .sales(r.sales())
                        .image(pickEmojiByCategoryThenName(r.categoryName(), r.name()))
                        .build())
                .toList();

        return TopMenusResponseDTO.builder()
                .date(LocalDateTime.now())
                .periodStart(ts)
                .periodEnd(te.minusSeconds(1))
                .storeId(storeId)
                .limit(limit)
                .items(items)
                .build();
    }

    private static String pickEmojiByCategoryThenName(String categoryName, String menuName) {
        String e = mapCategoryEmoji(categoryName);
        return e != null ? e : mapNameEmoji(menuName);
    }

    private static String mapCategoryEmoji(String categoryName) {
        if (categoryName == null) return null;
        String n = categoryName.trim();
        // 너 DB 스샷 기준 카테고리: 메뉴, 세트메뉴, 단품메뉴, 토스트, 사이드, 음료, 토스트세트, 커피, 시즌한정
        return switch (n) {
            case "토스트", "토스트세트" -> "🍞";
            case "사이드" -> "🍟";
            case "음료" -> "🥤";
            case "커피" -> "☕";
            case "세트메뉴" -> "🍱";
            case "단품메뉴" -> "🍽️";
            case "시즌한정" -> "✨";
            // 상위/루트 등 애매하면 null
            case "메뉴" -> null;
            default -> null;
        };
    }

    private static String mapNameEmoji(String name) {
        if (name == null || name.isBlank()) return null;
        String n = name.toLowerCase();
        if (n.contains("토스트") || n.contains("toast")) return "🍞";
        if (n.contains("버거") || n.contains("burger")) return "🍔";
        if (n.contains("치킨") || n.contains("chicken")) return "🍗";
        if (n.contains("감자튀김") || n.contains("감튀") || n.contains("fries")) return "🍟";
        if (n.contains("피자") || n.contains("pizza")) return "🍕";
        if (n.contains("핫도그") || n.contains("hot dog")) return "🌭";
        if (n.contains("샌드") || n.contains("sandwich") || n.contains("파니니") || n.contains("panini")) return "🥪";
        if (n.contains("치즈")) return "🧀";
        if (n.contains("콜라") || n.contains("coke") || n.contains("사이다") || n.contains("sprite") || n.contains("soda")) return "🥤";
        if (n.contains("커피") || n.contains("라떼") || n.contains("latte") || n.contains("espresso") || n.contains("americano")) return "☕";
        return null;
    }

    public HourlyStatsResponseDTO getTodayHourly(Long storeId) {
        LocalDate today = LocalDate.now();
        LocalDateTime ts = s(today), te = e(today);

        var rows = homeRepositoryCustom.aggregateHourly(ts, te, storeId, DONE);
        var items = rows.stream()
                .map(r -> HourlyStatDTO.builder()
                        .time(String.format("%02d:00", r.hour()))
                        .sales(r.sales())
                        .orders((int) r.orders())
                        .visitOrders((int) r.visitOrders())
                        .takeoutOrders((int) r.takeoutOrders())
                        .deliveryOrders((int) r.deliveryOrders())
                        .build())
                .toList();

        return HourlyStatsResponseDTO.builder()
                .date(today)
                .storeId(storeId)
                .items(items)
                .build();
    }

    // ===== helpers =====
    private static String formatWon(BigDecimal n) {
        long v = n.longValue();
        if (v >= 10000) { // 만원 단위 축약
            return "₩" + (v / 10000) + "만";
        }
        return NumberFormat.getCurrencyInstance(Locale.KOREA).format(v);
    }

    private static String diffPctStr(long a, long b) {
        if (b <= 0) return "어제 대비 +100%";
        double pct = (a - b) * 100.0 / b;
        return "어제 대비 " + (pct >= 0 ? "+" : "") + String.format(Locale.KOREA, "%.1f", pct) + "%";
    }

    private static String diffPctStr(BigDecimal a, BigDecimal b) {
        if (b == null || b.signum() <= 0) return "어제 대비 +100%";
        double pct = a.subtract(b).doubleValue() * 100.0 / b.doubleValue();
        return "어제 대비 " + (pct >= 0 ? "+" : "") + String.format(Locale.KOREA, "%.1f", pct) + "%";
    }

    private static ChangeType changeType(long a, long b) {
        if (a > b) return ChangeType.INCREASE;
        if (a < b) return ChangeType.DECREASE;
        return ChangeType.NEUTRAL;
    }

    private static ChangeType changeType(BigDecimal a, BigDecimal b) {
        int cmp = a.compareTo(b);
        if (cmp > 0) return ChangeType.INCREASE;
        if (cmp < 0) return ChangeType.DECREASE;
        return ChangeType.NEUTRAL;
    }

    private String findTopMenuName(LocalDateTime ts, LocalDateTime te, Long storeId) {
        var rows = homeRepositoryCustom.findTopMenus(ts, te, storeId, 1, DONE);
        return rows.isEmpty() ? "데이터 없음" : rows.get(0).name();
        // 필요 시 이미지/URL 확장 가능
    }

    private String findTopMenuQty(LocalDateTime ts, LocalDateTime te, Long storeId) {
        var rows = homeRepositoryCustom.findTopMenus(ts, te, storeId, 1, DONE);
        if (rows.isEmpty()) return null;
        return rows.get(0).qty() + "개 판매";
    }
}
