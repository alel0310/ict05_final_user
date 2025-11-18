package com.boot.ict05_final_user.domain.attendance.service;

import com.boot.ict05_final_user.config.security.auth.CustomUserDetails;
import com.boot.ict05_final_user.domain.attendance.dto.AttendanceListDTO;
import com.boot.ict05_final_user.domain.attendance.dto.AttendanceSearchDTO;
import com.boot.ict05_final_user.domain.attendance.dto.AttendanceWriteFormDTO;
import com.boot.ict05_final_user.domain.staff.entity.Attendance;
import com.boot.ict05_final_user.domain.staff.entity.AttendanceStatus;
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
import com.boot.ict05_final_user.config.security.principal.AppUser;


import java.time.LocalDate;

@RequiredArgsConstructor
@Service
@Transactional
@Slf4j
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final StaffRepository staffRepository;

    @PersistenceContext
    private EntityManager em;   // 필요 없으면 나중에 제거해도 됨

    /**
     * 로그인한 가맹점주의 storeId 기준으로
     * 해당 날짜의 근태 리스트(직원 + 근태)를 페이징 조회
     */

    // 검색 없는 기본 버전
    public Page<AttendanceListDTO> getDailyAttendance(LocalDate workDate, Pageable pageable) {
        return getDailyAttendance(workDate, pageable, null);
    }

    // 검색어 기능 있는 버전
    @Transactional(readOnly = true)
    public Page<AttendanceListDTO> getDailyAttendance(LocalDate workDate, Pageable pageable,  AttendanceSearchDTO searchDto) {

        Long storeId = getCurrentStoreId();

        if (storeId == null) {
            // 정책에 따라 전체 조회 허용/불허 결정
            log.warn("storeId 없음 → 가맹점주가 아닌 사용자 or 비로그인. 근태 조회 불가.");
            // 전체 조회 허용하고 싶으면 아래처럼:
            // return attendanceRepository.findDailyAttendanceByStore(null, workDate, pageable);
            return Page.empty(pageable);
        }

        log.info("하루 근태 조회 요청 - storeId: {}, date: {}, page: {}, size: {}, keyword={}, type={}, status={}",
                storeId,
                workDate,
                pageable.getPageNumber(),
                pageable.getPageSize(),
                searchDto != null ? searchDto.getKeyword() : null,
                searchDto != null ? searchDto.getType() : null,
                (searchDto != null && searchDto.getAttendanceStatus() != null)
                        ? searchDto.getAttendanceStatus().name()
                        : null
        );

        return attendanceRepository.findDailyAttendanceByStore(storeId, workDate, pageable, searchDto);
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

    /**
     * 직원 근태 등록
     * @param dto 근태 등록 정보를 담은 DTO
     * @param storeId 직원이 속할 매장의 storeId
     * @return 등록된 근태의 ID
     */
    public Long createAttendance(AttendanceWriteFormDTO dto, Long storeId) {
        // 직원 조회 (직원 정보 확인)
        var staff = staffRepository.findById(dto.getStaffId())
                .orElseThrow(() -> new IllegalArgumentException("직원이 존재하지 않습니다."));

        // 근태 상태 값 설정 (기본값은 NORMAL)
        AttendanceStatus status = dto.getAttendanceStatus() != null ? dto.getAttendanceStatus() : AttendanceStatus.NORMAL;

        // 근태 데이터 생성
        Attendance attendance = Attendance.builder()
                .staffProfile(staff)  // 직원 정보
                .workDate(dto.getAttendanceWorkDate())  // 근무 일자
                .checkIn(dto.getAttendanceCheckIn())  // 출근 시간
                .checkOut(dto.getAttendanceCheckOut())  // 퇴근 시간
                .status(status)  // 근태 상태
                .workHours(dto.getAttendanceWorkHours())  // 실제 근무 시간
                .memo(dto.getAttendanceMemo())  // 비고/사유
                .build();

        // 근태 저장
        attendanceRepository.save(attendance);

        // 등록된 근태의 ID 반환
        return attendance.getId();
    }
}
