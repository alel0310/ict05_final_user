package com.boot.ict05_final_user.domain.staff.controller;

import com.boot.ict05_final_user.domain.staff.service.StaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;

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

}