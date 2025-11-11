package com.boot.ict05_final_user.domain.staff.service;

import com.boot.ict05_final_user.config.security.auth.CustomUserDetails;
import com.boot.ict05_final_user.domain.staff.dto.StaffListDTO;
import com.boot.ict05_final_user.domain.staff.dto.StaffSearchDTO;
import com.boot.ict05_final_user.domain.staff.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@RequiredArgsConstructor
@Service
@Transactional
@Slf4j
public class StaffService {

    private final StaffRepository staffRepository;

    /**
     * 전체 직원 목록을 조회한다. (페이징 없이 전체 반환)
     *
     * @return 직원 리스트 DTO
     */
    public List<StaffListDTO> selectAllStaff() {
        StaffSearchDTO searchDTO = new StaffSearchDTO();

        Long storeId = getCurrentStoreId();
        if (storeId != null) {
            searchDTO.setStoreId(storeId);
        }
        // null이면 가맹점 필터 없이 전체 조회

        Pageable pageable = Pageable.unpaged();
        return staffRepository.listStaff(searchDTO, pageable).getContent();
    }


    // 🔹 현재 로그인한 가맹점의 storeId 가져오는 메서드
    private Long getCurrentStoreId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // 인증 정보 자체가 없으면 null 리턴 (필터 안 걸기)
        if (auth == null || !auth.isAuthenticated()) {
            log.warn("인증 정보 없음, 전체 직원 조회 (임시)");
            return null;
        }

        Object principal = auth.getPrincipal();

        // 우리가 만든 CustomUserDetails 인 경우
        if (principal instanceof CustomUserDetails user) {
            return user.getStoreId();
        }

        // 스프링 기본 UserDetails, 문자열(anonymousUser) 등인 경우
        if (principal instanceof String s) {
            if ("anonymousUser".equals(s)) {
                log.warn("anonymousUser 상태, 전체 직원 조회 (임시)");
                return null;
            }
            // 여기서 s 를 이메일로 보고 DB에서 storeId 찾아오는 것도 가능 (추후)
            log.warn("String principal: {}", s);
            return null;
        }

        log.warn("예상 못한 principal 타입: {}", principal.getClass());
        return null;
    }


}
