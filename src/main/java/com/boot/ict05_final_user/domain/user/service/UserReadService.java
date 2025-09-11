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
        return userRepository.findStoreIdByUsername(username);
    }

    @Transactional(readOnly = true)
    public Long findMemberIdByUsername(String username) {
        return userRepository.findMamberId(username);
    }

    @Transactional(readOnly = true)
    public String findMemberNameByUsername(String username) {
        return userRepository.findMemberName(username);
    }
}
