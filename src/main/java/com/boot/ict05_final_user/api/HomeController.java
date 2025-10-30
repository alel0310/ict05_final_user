package com.boot.ict05_final_user.api;

import com.boot.ict05_final_user.domain.home.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/dashboard")
@CrossOrigin(
        origins = {"http://localhost:3000"}, // 운영/개발 도메인 맞춰서 교체
        allowCredentials = "true"
)
public class HomeController {
    @GetMapping("/kpis/today")
    public KpiCardsResponseDTO getTodayKpis(@RequestParam(required = false) Long storeId) {
        // TODO: 이후 service.getTodayKpis(storeId)로 교체
        List<KpiCardDTO> cards = List.of(
                KpiCardDTO.builder()
                        .key("sales_today")
                        .value("₩999만")
                        .change("어제 대비 +8.2%")
                        .changeType(ChangeType.INCREASE)
                        .build(),
                KpiCardDTO.builder()
                        .key("orders_today")
                        .value("888건")
                        .change("어제 대비 +12건")
                        .changeType(ChangeType.INCREASE)
                        .build(),
                KpiCardDTO.builder()
                        .key("visitors_today")
                        .value("777명")
                        .change("어제 대비 +15명")
                        .changeType(ChangeType.INCREASE)
                        .build(),
                KpiCardDTO.builder()
                        .key("top_menu")
                        .value("치킨7치킨")
                        .change("28개 판매")
                        .changeType(ChangeType.INCREASE) // 혹은 NEUTRAL
                        .build()
        );

        return KpiCardsResponseDTO.builder()
                .date(LocalDateTime.now())
                .storeId(storeId)
                .cards(cards)
                .build();
    }

    /**
     * Top5 인기메뉴(오늘) — 임시 하드코딩 버전
     * TODO: 나중에 HomeService.getTopMenus(storeId, periodStart, periodEnd, limit)로 교체
     */
    @GetMapping(value = "/menus/top5")
    public TopMenusResponseDTO getTodayTopMenus(
            @RequestParam(required = false) Long storeId,
            @RequestParam(defaultValue = "5") Integer limit
    ) {
        LocalDateTime now = LocalDateTime.now();
        TopMenusResponseDTO body = TopMenusResponseDTO.builder()
                .date(now)
                .periodStart(now.toLocalDate().atStartOfDay())
                .periodEnd(now.withHour(23).withMinute(59).withSecond(59))
                .storeId(storeId)
                .limit(limit)
                .items(List.of(
                        TopMenuItemDTO.builder().menuId(101L).name("치치킨치킨").quantity(28).sales(420_000L).image("🍔").build(),
                        TopMenuItemDTO.builder().menuId(102L).name("불고기버거").quantity(24).sales(360_000L).image("🍔").build(),
                        TopMenuItemDTO.builder().menuId(203L).name("감자튀김(L)").quantity(35).sales(175_000L).image("🍟").build(),
                        TopMenuItemDTO.builder().menuId(304L).name("콜라(L)").quantity(42).sales(126_000L).image("🥤").build(),
                        TopMenuItemDTO.builder().menuId(305L).name("치즈스틱").quantity(18).sales(108_000L).image("🧀").build()
                ))
                .build();

        return body;
    }

    @GetMapping("/hourly/today")
    public HourlyStatsResponseDTO getTodayHourly(
            @RequestParam(required = false) Long storeId
    ) {
        // TODO: 나중에 service로 교체
        List<HourlyStatDTO> items = List.of(
                HourlyStatDTO.builder().time("09:00").sales(125_000L).orders(8).visitOrders(12).takeoutOrders(7).deliveryOrders(9).build(),
                HourlyStatDTO.builder().time("10:00").sales(180_000L).orders(12).visitOrders(18).takeoutOrders(8).deliveryOrders(11).build(),
                HourlyStatDTO.builder().time("11:00").sales(320_000L).orders(18).visitOrders(25).takeoutOrders(5).deliveryOrders(9).build(),
                HourlyStatDTO.builder().time("12:00").sales(580_000L).orders(35).visitOrders(45).takeoutOrders(5).deliveryOrders(11).build(),
                HourlyStatDTO.builder().time("13:00").sales(520_000L).orders(28).visitOrders(38).takeoutOrders(4).deliveryOrders(9).build(),
                HourlyStatDTO.builder().time("14:00").sales(380_000L).orders(22).visitOrders(30).takeoutOrders(3).deliveryOrders(11).build(),
                HourlyStatDTO.builder().time("15:00").sales(280_000L).orders(16).visitOrders(22).takeoutOrders(4).deliveryOrders(9).build(),
                HourlyStatDTO.builder().time("16:00").sales(350_000L).orders(20).visitOrders(28).takeoutOrders(7).deliveryOrders(11).build(),
                HourlyStatDTO.builder().time("17:00").sales(480_000L).orders(28).visitOrders(35).takeoutOrders(8).deliveryOrders(9).build(),
                HourlyStatDTO.builder().time("18:00").sales(620_000L).orders(38).visitOrders(48).takeoutOrders(2).deliveryOrders(11).build(),
                HourlyStatDTO.builder().time("19:00").sales(680_000L).orders(42).visitOrders(52).takeoutOrders(5).deliveryOrders(9).build(),
                HourlyStatDTO.builder().time("20:00").sales(590_000L).orders(35).visitOrders(42).takeoutOrders(7).deliveryOrders(11).build()
        );

        return HourlyStatsResponseDTO.builder()
                .date(LocalDate.now())
                .storeId(storeId)
                .items(items)
                .build();
    }
}
