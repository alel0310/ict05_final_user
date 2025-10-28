package com.boot.ict05_final_user.api;

import com.boot.ict05_final_user.domain.home.dto.ChangeType;
import com.boot.ict05_final_user.domain.home.dto.KpiCardDTO;
import com.boot.ict05_final_user.domain.home.dto.KpiCardsResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

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
                        .value("₩555만")
                        .change("어제 대비 +8.2%")
                        .changeType(ChangeType.INCREASE)
                        .build(),
                KpiCardDTO.builder()
                        .key("orders_today")
                        .value("444건")
                        .change("어제 대비 +12건")
                        .changeType(ChangeType.INCREASE)
                        .build(),
                KpiCardDTO.builder()
                        .key("visitors_today")
                        .value("333명")
                        .change("어제 대비 +15명")
                        .changeType(ChangeType.INCREASE)
                        .build(),
                KpiCardDTO.builder()
                        .key("top_menu")
                        .value("치킨맛버거")
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
}
