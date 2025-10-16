package com.boot.ict05_final_user.api;

import com.boot.ict05_final_user.domain.user.dto.UserRequestDTO;
import com.boot.ict05_final_user.domain.user.dto.UserResponseDTO;
import com.boot.ict05_final_user.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.Collections;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/user")
@CrossOrigin(
        origins = {"http://localhost:3000"}, // 운영/개발 도메인 맞춰서 교체
        allowCredentials = "true"
)
public class UserController {

    private final UserService userService;

    /** 아이디(자체 로그인) 중복 여부 확인 */
    @PostMapping(value = "/exist", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Boolean> existUserApi(
            @Validated(UserRequestDTO.existGroup.class) @RequestBody UserRequestDTO dto
    ) {
        return ResponseEntity.ok(userService.existUser(dto));
    }

    /** 회원가입 */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Long>> joinApi(
            @Validated(UserRequestDTO.addGroup.class) @RequestBody UserRequestDTO dto
    ) {
        Long id = userService.addUser(dto);
        return ResponseEntity.status(201)
                .body(Collections.singletonMap("userEntityId", id));
    }

    /** 내 정보 조회 (인증 필요) */
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public UserResponseDTO userMeApi() {
        return userService.readUser();
    }

    /** 내 정보 수정 (자체 로그인 유저만) */
    @PutMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Long> updateUserApi(
            @Validated(UserRequestDTO.updateGroup.class) @RequestBody UserRequestDTO dto
    ) throws AccessDeniedException {
        return ResponseEntity.ok(userService.updateUser(dto));
    }

    /** 유저 삭제 (자체/소셜) */
    @DeleteMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Boolean> deleteUserApi(
            @Validated(UserRequestDTO.deleteGroup.class) @RequestBody UserRequestDTO dto
    ) throws AccessDeniedException {
        userService.deleteUser(dto);
        return ResponseEntity.ok(true);
    }
}
