package com.boot.ict05_final_user.domain.staff.controller;

import com.boot.ict05_final_user.domain.staff.dto.StaffListDTO;
import com.boot.ict05_final_user.domain.staff.service.StaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffRestController {

    private final StaffService staffService;

    @GetMapping("/list")
    public List<StaffListDTO> getStaffList() {
        System.out.println(">>>> StaffRestController.getStaffList 호출됨");
        return staffService.selectAllStaff();
    }
}
