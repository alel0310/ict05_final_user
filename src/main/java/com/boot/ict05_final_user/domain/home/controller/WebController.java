package com.boot.ict05_final_user.domain.home.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class WebController {

    // SPA 지원: 명시된 프론트엔드 라우트 및 하위 경로를 index.html로 포워딩
    @GetMapping(value = {"/", "/login", "/register", "/dashboard/**"})
    public String getIndexHtml() {
        return "forward:/index.html";
    }
}
