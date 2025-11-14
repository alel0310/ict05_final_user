package com.boot.ict05_final_user.domain.staff.controller;

import com.boot.ict05_final_user.config.security.principal.AppUser;
import com.boot.ict05_final_user.domain.staff.dto.StaffListDTO;
import com.boot.ict05_final_user.domain.staff.dto.StaffModifyFormDTO;
import com.boot.ict05_final_user.domain.staff.dto.StaffWriteFormDTO;
import com.boot.ict05_final_user.domain.staff.entity.StaffProfile;
import com.boot.ict05_final_user.domain.staff.repository.AttendanceRepository;
import com.boot.ict05_final_user.domain.staff.repository.StaffRepository;
import com.boot.ict05_final_user.domain.staff.service.StaffService;
import com.boot.ict05_final_user.domain.store.entity.Store;
import com.boot.ict05_final_user.domain.store.service.StoreService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;


/**
 * 직원 관련 REST API 컨트롤러
 *
 * <p>이 컨트롤러는 다음과 같은 기능을 제공합니다:</p>
 * <ul>
 *     <li>직원 등록</li>
 *     <li>직원 수정</li>
 * </ul>
 *
 * <p>
 * 검증 및 데이터 바인딩을 수행합니다.
 *
 * @author 채은
 * @since 2025.10.21
 */
@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
@Tag(name = "직원 API", description = "직원 등록/조회/수정 기능 제공")
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
public class StaffRestController {

    private final StaffService staffService;
    private final StaffRepository staffRepository;
    private final StoreService storeService;
    private final AttendanceRepository attendanceRepository;

    /**
     * 직원 목록 API
     */
    @GetMapping("/list")
    public Page<StaffListDTO> getStaffList(
            @AuthenticationPrincipal AppUser user,
            @RequestParam(defaultValue = "0") int page,   // 0부터 시작
            @RequestParam(defaultValue = "8") int size   // 한 페이지 8명
    ) {
        log.info("GET /api/staff/list page={}, size={}, storeId={}", page, size, user.getStoreId());

        Long storeId = user.getStoreId();

        Pageable pageable = PageRequest.of(page, size); // 필요하면 sort도 추가 가능

        return staffService.selectAllStaff(storeId, pageable);
    }

    /**
     * 직원 등록 API
     * 직원 데이터를 저장하고 생성된 직원 ID를 반환한다.
     */
    @PostMapping("/add")
    public ResponseEntity<Long> creatStaff(
            @Valid @RequestBody StaffWriteFormDTO dto,
            @AuthenticationPrincipal AppUser user
    ) {
        log.info("POST /api/staff/add dto={}, storeId={}", dto, user.getStoreId());

        Store store = storeService.findById(user.getStoreId());

        StaffProfile staff = StaffProfile.builder()
                .store(store)
                .staffName(dto.getStaffName())
                .staffEmploymentType(dto.getStaffEmploymentType())
                .staffEmail(dto.getStaffEmail())
                .staffPhone(dto.getStaffPhone())
                .staffBirth(dto.getStaffBirth())
                .staffStartDate(dto.getStaffStartDate())
                .build();

        staffRepository.save(staff);
        log.info("직원 등록 완료 id={}", staff.getId());

        // 👇 근태 생성 없음 (attendance는 나중에 다른 기능에서 따로 처리)
        return ResponseEntity.ok(staff.getId());
    }


    /**
     * 직원 수정 API
     * 직원 데이터를 수정하고 수정된 직원 ID를 반환한다.
     */
    @PutMapping("/modify/{id}")
    public ResponseEntity<Void> modifyStaff(
            @PathVariable Long id,
            @Valid @RequestBody StaffModifyFormDTO dto,
            @AuthenticationPrincipal AppUser user
    ) {
        log.info("PUT /api/staff/modify/{} dto={}, storeId={}", id, dto, user.getStoreId());

        // 1) 수정할 직원 찾기
        StaffProfile staff = staffRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("직원이 존재하지 않습니다."));

        // 2) 로그인한 사용자의 매장 직원인지 확인
        if (!staff.getStore().getId().equals(user.getStoreId())) {
            return ResponseEntity.status(403).build();
        }

        // 3) setter로 값 업데이트
        staff.setStaffName(dto.getStaffName());
        staff.setStaffEmploymentType(dto.getStaffEmploymentType());
        staff.setStaffEmail(dto.getStaffEmail());
        staff.setStaffPhone(dto.getStaffPhone());
        staff.setStaffBirth(dto.getStaffBirth());
        staff.setStaffStartDate(dto.getStaffStartDate());
        staff.setStaffEndDate(dto.getStaffEndDate());

        // 4) 저장
        staffRepository.save(staff);

        return ResponseEntity.noContent().build();
    }

    /**
     * 직원 삭제 API
     * 직원 데이터를 삭제한다.
     */
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteStaff(
            @PathVariable Long id,
            @AuthenticationPrincipal AppUser user
    ) {
        log.info("DELETE /api/staff/delete/{} storeId={}", id, user.getStoreId());

        // 1) 직원 조회
        StaffProfile staff = staffRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("직원이 존재하지 않습니다."));

        // 2) 로그인한 매장의 직원인지 확인
        if (!staff.getStore().getId().equals(user.getStoreId())) {
            return ResponseEntity.status(403).build();
        }

        // 3) 삭제
        staffRepository.delete(staff);

        return ResponseEntity.noContent().build();
    }


}
