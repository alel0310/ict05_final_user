package com.boot.ict05_final_user.domain.staff.service;

import com.boot.ict05_final_user.config.security.auth.CustomUserDetails;
import com.boot.ict05_final_user.domain.staff.dto.StaffListDTO;
import com.boot.ict05_final_user.domain.staff.dto.StaffSearchDTO;
import com.boot.ict05_final_user.domain.attendance.repository.AttendanceRepository;
import com.boot.ict05_final_user.domain.staff.repository.StaffRepository;
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

@RequiredArgsConstructor
@Service
@Transactional
@Slf4j
public class StaffService {

    private final StaffRepository staffRepository;
    private final AttendanceRepository attendanceRepository;

    // EM으로 최신 근태상태 한 번에 조회
    @PersistenceContext
    private EntityManager em;

    /**
     * 로그인한 가맹점주의 storeId 기준으로 직원 목록을 조회한다.
     * - storeId가 null인 경우(관리자 등)는 전체 조회
     * - QueryDSL에서 :storeId 조건으로 필터링
     *
     * @return 직원 리스트 DTO
     */
    public Page<StaffListDTO> selectAllStaff(Long storeId, Pageable pageable) {

        StaffSearchDTO searchDTO = new StaffSearchDTO();
        searchDTO.setStoreId(storeId);

        log.info("직원 목록 조회 요청 - storeId: {}, page: {}, size: {}",
                storeId != null ? storeId : "전체조회",
                pageable.getPageNumber(),
                pageable.getPageSize()
        );

        return staffRepository.listStaff(searchDTO, pageable);
    }

    /**
     * 현재 로그인한 사용자 정보에서 storeId 추출
     * 인증이 없거나 anonymousUser이면 null 반환
     */
    private Long getCurrentStoreId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            log.warn("인증 정보 없음 → 전체 직원 조회 (관리자용 혹은 비로그인)");
            return null;
        }

        Object principal = auth.getPrincipal();

        if (principal instanceof CustomUserDetails user) {
            Long storeId = user.getStoreId();
            log.debug("현재 로그인 사용자 storeId: {}", storeId);
            return storeId;
        }

        if (principal instanceof String s && "anonymousUser".equals(s)) {
            log.warn("anonymousUser → 전체 조회 허용 (임시)");
            return null;
        }

        log.warn("예상치 못한 principal 타입: {}", principal.getClass());
        return null;
    }

}
