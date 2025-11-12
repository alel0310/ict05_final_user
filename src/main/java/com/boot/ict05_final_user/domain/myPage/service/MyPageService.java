package com.boot.ict05_final_user.domain.myPage.service;

import com.boot.ict05_final_user.domain.myPage.dto.MyPageDTO;
import com.boot.ict05_final_user.domain.myPage.repository.MyPageRepository;
import com.boot.ict05_final_user.domain.user.entity.Member;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.security.access.AccessDeniedException;

@RequiredArgsConstructor
@Service
@Transactional
@Slf4j
public class MyPageService {

    private final MyPageRepository myPageRepository;

    @Transactional(readOnly = true)
    public MyPageDTO getMyInfo(Long memberId, Long storeIdIgnored){
        Member m = myPageRepository.findById(memberId)
                .orElseThrow(() -> new AccessDeniedException("권한이 없습니다"));
        return MyPageDTO.fromEntity(m);
    }
}
