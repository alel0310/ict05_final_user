package com.boot.ict05_final_user.domain.dailyClosing.controller;

import com.boot.ict05_final_user.domain.dailyClosing.dto.DailyClosingInitResponse;
import com.boot.ict05_final_user.domain.dailyClosing.service.DailyClosingService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/**
 * 일일 시재 마감 화면에서 사용하는 조회용 REST 컨트롤러.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/daily-closing")
public class DailyClosingController {

    private final DailyClosingService dailyClosingService;

    /**
     * 일일 시재 마감 화면 진입 시 필요한 데이터를 조회한다.
     *
     * date 파라미터가 없으면 오늘 날짜를 기준으로 조회한다.
     * 실제 서비스에서는 로그인 정보에서 점포 아이디를 추출해 사용해야 한다.
     *
     * @param principal 현재 로그인 사용자 정보
     * @param date      조회 기준 일자 (선택)
     * @return 화면에서 사용할 초기 데이터
     */
    @GetMapping("/close")
    public DailyClosingInitResponse getDailyClosing(
            @AuthenticationPrincipal Object principal,
            @RequestParam(value = "date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        if (date == null) {
            date = LocalDate.now();
        }

        Long storeId = extractStoreId(principal);

        return dailyClosingService.getDailyClosing(storeId, date);
    }

    /**
     * 로그인 정보에서 점포 아이디를 꺼내는 헬퍼 메서드.
     * 실제 프로젝트에서 사용하는 Principal 타입에 맞게 구현을 수정해야 한다.
     *
     * 예시
     *   if (principal instanceof StoreUserPrincipal user) {
     *       return user.getStoreId();
     *   }
     *
     * @param principal 인증 정보
     * @return 점포 아이디
     */
    private Long extractStoreId(Object principal) {
        throw new IllegalStateException("storeId 추출 로직을 DailyClosingRestController.extractStoreId 에 구현해 주세요.");
    }
}
