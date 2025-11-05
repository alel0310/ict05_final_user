package com.boot.ict05_final_user.domain.staff.service;

import com.boot.ict05_final_user.domain.staff.dto.StaffListDTO;
import com.boot.ict05_final_user.domain.staff.dto.StaffSearchDTO;
import com.boot.ict05_final_user.domain.staff.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Service
@Transactional
@Slf4j
public class StaffService {

    private final StaffRepository staffRepository;

    /**
     * 검색어로 필터링하여 공지사항 목록을 페이지 단위로 조회한다.
     *
     * @param staffSearchDTO 검색 (선택, null 가능)
     * @param pageable       페이지 정보 (페이지 번호, 크기, 정렬)
     * @return 페이징 처리된 직원 리스트 DTO
     */
    public Page<StaffListDTO> selectAllStaff(StaffSearchDTO staffSearchDTO, Pageable pageable) {
        return staffRepository.listStaff(staffSearchDTO, pageable);
    }

}
