package com.boot.ict05_final_user.domain.attendance.service;

import com.boot.ict05_final_user.domain.staff.entity.StaffProfile;
import com.boot.ict05_final_user.config.security.auth.CustomUserDetails;
import com.boot.ict05_final_user.config.security.principal.AppUser;
import com.boot.ict05_final_user.domain.attendance.dto.*;
import com.boot.ict05_final_user.domain.attendance.repository.AttendanceRepository;
import com.boot.ict05_final_user.domain.staff.entity.Attendance;
import com.boot.ict05_final_user.domain.staff.entity.AttendanceStatus;
import com.boot.ict05_final_user.domain.store.entity.Store;
import com.boot.ict05_final_user.domain.staff.repository.StaffRepository;
import com.boot.ict05_final_user.domain.store.repository.StoreRepository;
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

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;

@RequiredArgsConstructor
@Service
@Transactional
@Slf4j
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final StaffRepository staffRepository;
    private final StoreRepository storeRepository;

    @PersistenceContext
    private EntityManager em;

    /* ================== 하루 리스트 조회 ================== */

    // 검색 없는 기본 버전
    public Page<AttendanceListDTO> getDailyAttendance(LocalDate workDate, Pageable pageable) {
        return getDailyAttendance(workDate, pageable, null);
    }

    // 검색 + 필터 버전
    @Transactional(readOnly = true)
    public Page<AttendanceListDTO> getDailyAttendance(LocalDate workDate,
                                                      Pageable pageable,
                                                      AttendanceSearchDTO searchDto) {

        Long storeId = getCurrentStoreId();

        if (storeId == null) {
            log.warn("storeId 없음 → 가맹점주가 아닌 사용자 or 비로그인. 근태 조회 불가.");
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

    /* ================== 근태 등록 ================== */

    /**
     * 직원 근태 등록
     * @param dto     근태 등록 DTO
     * @param storeId 로그인한 점주의 storeId
     */
    public Long createAttendance(AttendanceWriteFormDTO dto, Long storeId) {

        // 1) 직원 조회
        StaffProfile staff = staffRepository.findById(dto.getStaffId())
                .orElseThrow(() -> new IllegalArgumentException("직원이 존재하지 않습니다."));

        // 2) 매장 검증
        if (storeId == null || staff.getStore() == null
                || !staff.getStore().getId().equals(storeId)) {
            throw new IllegalArgumentException("해당 매장의 직원이 아니므로 근태를 등록할 수 없습니다.");
        }

        // ⭐ storeId로 Store 조회
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new IllegalArgumentException("잘못된 매장(storeId)입니다."));

        // 3) 출퇴근 시간 검증
        LocalDateTime checkIn = dto.getAttendanceCheckIn();
        LocalDateTime checkOut = dto.getAttendanceCheckOut();

        if (checkIn == null || checkOut == null) {
            throw new IllegalArgumentException("출근/퇴근 시간은 필수입니다.");
        }

        if (checkIn.isAfter(checkOut)) {
            throw new IllegalArgumentException("출근 시간이 퇴근 시간보다 늦을 수 없습니다.");
        }

        // 4) 중복 근태 체크
        boolean exists = attendanceRepository.existsByStaffProfileIdAndWorkDate(
                staff.getId(), dto.getAttendanceWorkDate());

        if (exists) {
            throw new IllegalStateException("이미 해당 날짜에 등록된 근태가 있습니다.");
        }

        // 5) 근무 시간 계산
        BigDecimal workHours = calculateWorkHours(checkIn, checkOut);

        // 6) 근태 상태
        AttendanceStatus status = dto.getAttendanceStatus() != null
                ? dto.getAttendanceStatus()
                : AttendanceStatus.NORMAL;

        // 7) 엔티티 생성
        Attendance attendance = Attendance.builder()
                .staffProfile(staff)
                .store(store)             // ⭐ store 추가
                .workDate(dto.getAttendanceWorkDate())
                .checkIn(checkIn)
                .checkOut(checkOut)
                .status(status)
                .workHours(workHours)
                .memo(dto.getAttendanceMemo())
                .build();

        // 8) 저장
        attendanceRepository.save(attendance);

        return attendance.getId();
    }

    /**
     * 근태 상세 조회
     * 로그인한 점주의 storeId 기준으로, 해당 근태(attendanceId)가
     * 내 매장의 기록인지 검증하고 상세 정보를 반환한다.
     */
    @Transactional(readOnly = true)
    public AttendanceDetailDTO getAttendanceDetail(Long attendanceId) {
        Long storeId = getCurrentStoreId();

        if (storeId == null) {
            throw new IllegalStateException("가맹점 정보가 없어 근태 상세 조회를 할 수 없습니다.");
        }

        return attendanceRepository
                .findAttendanceDetailByIdAndStore(attendanceId, storeId)
                .orElseThrow(() -> new IllegalArgumentException("해당 근태 기록을 찾을 수 없습니다."));
    }

    /* ================== 근태 수정 폼 조회 ================== */

    /**
     * 근태 수정 화면에서 사용할 기존 데이터 조회
     * - 로그인한 점주의 storeId 기준으로 본인 매장 데이터만 조회
     */
    @Transactional(readOnly = true)
    public AttendanceModifyFormDTO getAttendanceModifyForm(Long attendanceId) {

        Long storeId = getCurrentStoreId();
        if (storeId == null) {
            throw new IllegalStateException("가맹점 정보가 없어 근태 수정 폼을 조회할 수 없습니다.");
        }

        com.boot.ict05_final_user.domain.staff.entity.Attendance attendance =
                attendanceRepository.findById(attendanceId)
                        .orElseThrow(() -> new IllegalArgumentException("근태 정보를 찾을 수 없습니다. id=" + attendanceId));

        // 내 매장 데이터인지 검증
        if (attendance.getStore() == null
                || attendance.getStore().getId() == null
                || !attendance.getStore().getId().equals(storeId)) {
            throw new IllegalArgumentException("현재 로그인한 매장의 근태 정보가 아닙니다.");
        }

        // === Entity -> DTO 매핑 ===
        AttendanceModifyFormDTO dto = new AttendanceModifyFormDTO();
        dto.setAttendanceId(attendance.getId());
        dto.setAttendanceWorkDate(attendance.getWorkDate());
        dto.setAttendanceCheckIn(attendance.getCheckIn());
        dto.setAttendanceCheckOut(attendance.getCheckOut());
        dto.setAttendanceStatus(attendance.getStatus());
        dto.setAttendanceWorkHours(attendance.getWorkHours());
        dto.setAttendanceMemo(attendance.getMemo());

        StaffProfile staff = attendance.getStaffProfile();
        if (staff != null) {
            dto.setStaffId(staff.getId());
            dto.setStaffName(staff.getStaffName());
            dto.setStaffEmploymentType(staff.getStaffEmploymentType());
        }

        return dto;
    }

    /* ================== 근태 수정 저장 ================== */

    /**
     * 근태 수정
     * - 출퇴근 시간/상태/메모/근무시간 등을 변경
     * - staff 변경 허용 여부는 정책에 따라 선택 (지금은 같은 매장 직원일 때만 변경 가능하게 예시)
     */
    public void modifyAttendance(AttendanceModifyFormDTO dto) {

        Long storeId = getCurrentStoreId();
        if (storeId == null) {
            throw new IllegalStateException("가맹점 정보가 없어 근태 수정을 할 수 없습니다.");
        }

        com.boot.ict05_final_user.domain.staff.entity.Attendance attendance =
                attendanceRepository.findById(dto.getAttendanceId())
                        .orElseThrow(() -> new IllegalArgumentException("근태 정보를 찾을 수 없습니다. id=" + dto.getAttendanceId()));

        // 내 매장 데이터인지 검증
        if (attendance.getStore() == null
                || attendance.getStore().getId() == null
                || !attendance.getStore().getId().equals(storeId)) {
            throw new IllegalArgumentException("현재 로그인한 매장의 근태 정보가 아닙니다.");
        }

        // ===== 직원 변경 허용 (옵션) =====
        if (dto.getStaffId() != null
                && (attendance.getStaffProfile() == null
                || !dto.getStaffId().equals(attendance.getStaffProfile().getId()))) {

            StaffProfile newStaff = staffRepository.findById(dto.getStaffId())
                    .orElseThrow(() -> new IllegalArgumentException("직원 정보를 찾을 수 없습니다. id=" + dto.getStaffId()));

            // 새 직원도 같은 매장인지 검증
            if (newStaff.getStore() == null
                    || newStaff.getStore().getId() == null
                    || !newStaff.getStore().getId().equals(storeId)) {
                throw new IllegalArgumentException("해당 매장의 직원이 아니라 근태를 변경할 수 없습니다.");
            }

            attendance.setStaffProfile(newStaff);
        }

        // ===== 출퇴근 시간 / 근무 시간 / 상태 / 메모 수정 =====

        LocalDateTime checkIn = dto.getAttendanceCheckIn();
        LocalDateTime checkOut = dto.getAttendanceCheckOut();

        if (checkIn == null || checkOut == null) {
            throw new IllegalArgumentException("출근/퇴근 시간은 필수입니다.");
        }
        if (checkIn.isAfter(checkOut)) {
            throw new IllegalArgumentException("출근 시간이 퇴근 시간보다 늦을 수 없습니다.");
        }

        attendance.setWorkDate(dto.getAttendanceWorkDate());
        attendance.setCheckIn(checkIn);
        attendance.setCheckOut(checkOut);
        attendance.setStatus(dto.getAttendanceStatus() != null
                ? dto.getAttendanceStatus()
                : AttendanceStatus.NORMAL);
        attendance.setMemo(dto.getAttendanceMemo());

        // 근무 시간: 프론트에서 직접 보낸 값이 있으면 우선 사용, 아니면 다시 계산
        if (dto.getAttendanceWorkHours() != null) {
            attendance.setWorkHours(dto.getAttendanceWorkHours());
        } else {
            attendance.setWorkHours(calculateWorkHours(checkIn, checkOut));
        }

        // 클래스 전체가 @Transactional 이라서 별도 save() 없이 dirty checking으로 업데이트됨
        log.info("📌 근태 수정 완료: attendanceId={}, storeId={}", attendance.getId(), storeId);
    }

    /**
     * 근태 삭제
     * - 출퇴근 시간/상태/메모/근무시간 등을 삭제
     */
    public void deleteDailyAttendanceForStaff(Long staffId, LocalDate workDate) {
        Long storeId = getCurrentStoreId();
        if (storeId == null) {
            throw new IllegalStateException("가맹점 정보가 없어 근태 삭제를 할 수 없습니다.");
        }

        long deleted = attendanceRepository.deleteByStoreAndStaffAndWorkDate(storeId, staffId, workDate);
        if (deleted == 0) {
            throw new IllegalArgumentException("해당 날짜의 근태를 찾을 수 없거나 삭제 권한이 없습니다.");
        }

        log.info("✅ 직원 하루 근태 일괄 삭제 완료: storeId={}, staffId={}, date={}, deletedRows={}",
                storeId, staffId, workDate, deleted);
    }

    /* ================== 공통 유틸 ================== */

    private Long getCurrentStoreId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            log.warn("인증 정보 없음 → storeId 조회 불가");
            return null;
        }

        Object principal = auth.getPrincipal();
        log.debug("근태 principal 타입: {}", principal.getClass());

        if (principal instanceof AppUser appUser) {
            return appUser.getStoreId();
        }
        if (principal instanceof CustomUserDetails user) {
            return user.getStoreId();
        }
        if (principal instanceof String s && "anonymousUser".equals(s)) {
            log.warn("anonymousUser → storeId 없음");
            return null;
        }

        log.warn("예상치 못한 principal 타입: {}", principal.getClass());
        return null;
    }

    private BigDecimal calculateWorkHours(LocalDateTime checkIn, LocalDateTime checkOut) {
        long minutes = Duration.between(checkIn, checkOut).toMinutes();

        if (minutes < 0) {
            minutes = 0;
        }

        return BigDecimal.valueOf(minutes)
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
    }


}
