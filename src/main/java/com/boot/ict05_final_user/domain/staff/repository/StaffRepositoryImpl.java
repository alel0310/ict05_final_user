package com.boot.ict05_final_user.domain.staff.repository;

import com.boot.ict05_final_user.domain.staff.dto.StaffListDTO;
import com.boot.ict05_final_user.domain.staff.dto.StaffSearchDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class StaffRepositoryImpl implements StaffRepositoryCustom{
	@Override
	public Page<StaffListDTO> listStaff(StaffSearchDTO staffSearchDTO, Pageable pageable) {
		return null;
	}
}
