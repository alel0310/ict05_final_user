package com.boot.ict05_final_user.domain.myPage.controller;

import com.boot.ict05_final_user.config.security.principal.AppUser;
import com.boot.ict05_final_user.domain.myPage.dto.MyPageDTO;
import com.boot.ict05_final_user.domain.myPage.service.MyPageService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.util.Map;

@RestController
@RequestMapping("/api")   // ⇒ 최종 경로: /user/api/...
@RequiredArgsConstructor
public class MyPageRestController {

    private final MyPageService myPageService;

    // 1) 마이페이지 조회
    @GetMapping("/myPage")
    @Operation(summary = "마이페이지 상세 조회", description = "회원의 프로필 정보를 조회한다.")
    public ResponseEntity<MyPageDTO> myPage(@AuthenticationPrincipal AppUser user) {
        MyPageDTO dto = myPageService.getMyPro(user.getMemberId());
        return ResponseEntity.ok(dto);
    }

    // 2) 마이페이지 기본 정보 수정(이름, 전화번호 등)
    @PutMapping("/myPage")
    public ResponseEntity<MyPageDTO> updateMyPage(
            @AuthenticationPrincipal AppUser user,
            @RequestBody MyPageDTO request
    ) {
        MyPageDTO updated = myPageService.updateMyPage(user.getMemberId(), request);
        return ResponseEntity.ok(updated);
    }

    // 2-1) 프로필 이미지 업로드
    @PostMapping(
            value = "/myPage/profile-image",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @Operation(summary = "프로필 이미지 업로드")
    public ResponseEntity<MyPageDTO> uploadProfileImage(
            @AuthenticationPrincipal AppUser user,
            @RequestPart("file") MultipartFile file
    ) {
        MyPageDTO updated = myPageService.updateProfileImage(user.getMemberId(), file);
        return ResponseEntity.ok(updated);
    }

    // 프로필 이미지 조회  헤더에서 사용하는 용도
    @GetMapping("/myPage/profile-image")
    public ResponseEntity<Resource> getMyProfileImage(
            @AuthenticationPrincipal AppUser user
    ) throws IOException {

        Long memberId = user.getMemberId();
        Resource image = myPageService.loadProfileImage(memberId);

        if (image == null) {
            // 이미지 없으면 404  프론트에서는 기본 이미지로 처리
            return ResponseEntity.notFound().build();
        }

        String contentType = Files.probeContentType(image.getFile().toPath());
        if (contentType == null) {
            contentType = MediaType.IMAGE_PNG_VALUE;
        }

        return ResponseEntity
                .ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(image);
    }

    // 프로필 이미지 기본값으로 초기화
    @DeleteMapping("/myPage/profile-image")
    @Operation(summary = "프로필 이미지 초기화", description = "저장된 프로필 이미지를 제거하고 기본 이미지로 되돌린다.")
    public ResponseEntity<Void> resetProfileImage(@AuthenticationPrincipal AppUser user) {
        myPageService.resetProfileImage(user.getMemberId());
        return ResponseEntity.noContent().build();   // 204
    }

    // 3) 현재 비밀번호 확인
    @PostMapping("/myPage/check-password")
    public ResponseEntity<?> checkPassword(
            @AuthenticationPrincipal AppUser user,
            @RequestBody Map<String, String> body
    ) {
        String currentPassword = body.get("currentPassword");
        if (currentPassword == null || currentPassword.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "현재 비밀번호가 비어 있습니다."));
        }

        boolean ok = myPageService.checkCurrentPassword(user.getMemberId(), currentPassword);
        if (!ok) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "현재 비밀번호가 일치하지 않습니다."));
        }

        return ResponseEntity.ok().build();   // 200, body 없음
    }

    // 4) 비밀번호 변경
    @PostMapping("/myPage/change-password")
    public ResponseEntity<?> changePassword(
            @AuthenticationPrincipal AppUser user,
            @RequestBody Map<String, String> body
    ) {
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");

        if (currentPassword == null || currentPassword.isBlank()
                || newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "비밀번호가 비어 있습니다."));
        }

        myPageService.updatePassword(user.getMemberId(), currentPassword, newPassword);
        return ResponseEntity.ok().build();
    }

    // 5) 회원 탈퇴
    @DeleteMapping("/myPage")
    @Operation(summary = "회원 탈퇴", description = "회원 상태를 WITHDRAW 로 변경하고 Refresh 토큰을 제거한다.")
    public ResponseEntity<Void> withdraw(@AuthenticationPrincipal AppUser user) {

        myPageService.withdrawMember(user.getMemberId());

        return ResponseEntity.noContent().build();   // 204
    }

}
