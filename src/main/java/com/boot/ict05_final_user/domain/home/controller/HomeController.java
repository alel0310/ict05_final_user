package com.boot.ict05_final_user.domain.home.controller;

import com.boot.ict05_final_user.config.security.principal.AppUser;
import com.boot.ict05_final_user.domain.home.dto.*;
import com.boot.ict05_final_user.domain.home.service.HomeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    private final HomeService homeService;

    @GetMapping("/kpis/today")
    public KpiCardsResponseDTO getTodayKpis(@AuthenticationPrincipal AppUser user) {
        Long storeId = user.getStoreId();
        return homeService.getTodayKpis(storeId);
    }

    @GetMapping(value = "/menus/top5")
    public TopMenusResponseDTO getTodayTopMenus(
            @AuthenticationPrincipal AppUser user,
            @RequestParam(defaultValue = "5") Integer limit
    ) {
        Long storeId = user.getStoreId();
        return homeService.getTopMenus(storeId, limit);
    }

    @GetMapping("/hourly/today")
    public HourlyStatsResponseDTO getTodayHourly(
            @AuthenticationPrincipal AppUser user
    ) {
        Long storeId = user.getStoreId();
        return homeService.getTodayHourly(storeId);
    }
}
