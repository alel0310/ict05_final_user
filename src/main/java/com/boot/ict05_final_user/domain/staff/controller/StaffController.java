package com.boot.ict05_final_user.domain.staff.controller;

import com.boot.ict05_final_user.domain.staff.dto.StaffListDTO;
import com.boot.ict05_final_user.domain.staff.dto.StaffSearchDTO;
import com.boot.ict05_final_user.domain.staff.service.StaffService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.querydsl.QPageRequest;
import org.springframework.data.web.PageableDefault;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * 직원 관리 화면 컨트롤러.
 * <p>
 * 직원 목록 조회, 등록 화면, 상세 조회, 수정 화면, 삭제 등
 * 화면 렌더링과 모델 구성 역할을 담당한다.
 */
@RequiredArgsConstructor
@Controller
public class StaffController {

    private final StaffService staffService;

    /**
     * 직원 목록을 페이징 처리하여 조회한다.
     *
     * @param staffSearchDTO (선택) 작성자 이름으로 검색할 경우 전달되는 값
     * @param pageable       페이지 번호, 크기, 정렬 조건을 포함한 페이징 객체
     * @param model          뷰에 전달할 모델 객체
     * @return 직원 목록 페이지 뷰 이름
     */
    @GetMapping("/staff/list")
    public String listStoreStaff(StaffSearchDTO staffSearchDTO, @PageableDefault(page = 1, size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable,
                                 Model model,
                                 HttpServletRequest request) {

        PageRequest pageRequest = PageRequest.of(
                pageable.getPageNumber()-1,
                pageable.getPageSize(),
                Sort.by("id").descending());

        Page<StaffListDTO> staffs = staffService.selectAllStaff(staffSearchDTO, pageRequest);

        model.addAttribute("staffs", staffs);
        model.addAttribute("staffSearchDTO", staffSearchDTO);

        return "staff/list";

    }
}