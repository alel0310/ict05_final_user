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
        Pageable pageable = Pageable.unpaged(); // 전체 조회용

        return staffRepository.listStaff(searchDTO, pageable).getContent();
    }

}
