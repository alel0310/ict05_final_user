package com.boot.ict05_final_user.domain.staff.service;

import com.boot.ict05_final_user.config.security.auth.CustomUserDetails;
import com.boot.ict05_final_user.domain.staff.dto.AttendanceListDTO;
import com.boot.ict05_final_user.domain.staff.repository.AttendanceRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.boot.ict05_final_user.config.security.principal.AppUser;


import java.time.LocalDate;

@RequiredArgsConstructor
@Service
@Transactional
@Slf4j
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;

    @PersistenceContext
    private EntityManager em;   // 필요 없으면 나중에 제거해도 됨

    /**
     * 로그인한 가맹점주의 storeId 기준으로
     * 해당 날짜의 근태 리스트(직원 + 근태)를 페이징 조회
     */
    public Page<AttendanceListDTO> getDailyAttendance(LocalDate workDate, Pageable pageable) {

        Long storeId = getCurrentStoreId();

        if (storeId == null) {
            // 정책에 따라 전체 조회 허용/불허 결정
            log.warn("storeId 없음 → 가맹점주가 아닌 사용자 or 비로그인. 근태 조회 불가.");
            // 전체 조회 허용하고 싶으면 아래처럼:
            // return attendanceRepository.findDailyAttendanceByStore(null, workDate, pageable);
            return Page.empty(pageable);
        }

        log.info("하루 근태 조회 요청 - storeId: {}, date: {}, page: {}, size: {}",
                storeId,
                workDate,
                pageable.getPageNumber(),
                pageable.getPageSize()
        );

        return attendanceRepository.findDailyAttendanceByStore(storeId, workDate, pageable);
    }

    /**
     * 현재 로그인한 사용자 정보에서 storeId 추출
     * 인증이 없거나 anonymousUser이면 null 반환
     */
    private Long getCurrentStoreId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            log.warn("인증 정보 없음 → storeId 조회 불가");
            return null;
        }

        Object principal = auth.getPrincipal();
        log.debug("근태 조회 principal 타입: {}", principal.getClass());

        // ✅ 1) 지금 실제로 쓰이는 AppUser 우선 처리
        if (principal instanceof AppUser appUser) {
            Long storeId = appUser.getStoreId();
            log.debug("현재 로그인 AppUser storeId: {}", storeId);
            return storeId;
        }

        if (principal instanceof CustomUserDetails user) {
            Long storeId = user.getStoreId();
            log.debug("현재 로그인 사용자 storeId: {}", storeId);
            return storeId;
        }

        if (principal instanceof String s && "anonymousUser".equals(s)) {
            log.warn("anonymousUser → storeId 없음");
            return null;
        }

        log.warn("예상치 못한 principal 타입: {}", principal.getClass());
        return null;
    }
}
