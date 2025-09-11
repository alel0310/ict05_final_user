package com.boot.ict05_final_user.domain.user.service;

import com.boot.ict05_final_user.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserReadService {
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Long findStoreIdByUsername(String username) {
        // 예: JPQL/QueryDSL projection으로 바로 store_id만 반환
        return userRepository.findStoreIdByUsername(username); // Long 반환 형태 권장
    }
}
