package com.boot.ict05_final_user.domain.user.service;

import com.boot.ict05_final_user.domain.staff.repository.StaffRepository;
import com.boot.ict05_final_user.domain.user.entity.Member;
import com.boot.ict05_final_user.domain.user.repository.MemberRepository;
import com.boot.ict05_final_user.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserReadService {
    private final UserRepository userRepository;
    private final MemberRepository memberRepository;
    private final StaffRepository staffRepository;

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

    public String findStoreNameByUsername(String username) {
        // username(email) → member → staffProfile → store → name
        Member member = memberRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException(username));

        return staffRepository.findByMember_Id(member.getId())
                .map(staff -> staff.getStore() != null ? staff.getStore().getName() : null)
                .orElse(null);
    }
}
