package com.boot.ict05_final_user.domain.myPage.service;

import com.boot.ict05_final_user.config.security.jwt.service.JwtService;
import com.boot.ict05_final_user.domain.myPage.dto.MyPageDTO;
import com.boot.ict05_final_user.domain.myPage.repository.MyPageRepository;
import com.boot.ict05_final_user.domain.staff.entity.StaffProfile;
import com.boot.ict05_final_user.domain.staff.repository.StaffRepository;
import com.boot.ict05_final_user.domain.user.entity.Member;
import com.boot.ict05_final_user.domain.user.entity.MemberStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.security.access.AccessDeniedException;

@RequiredArgsConstructor
@Service
@Slf4j
public class MyPageService {

    private final MyPageRepository myPageRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final StaffRepository staffRepository;

    @Transactional(readOnly = true)
    public MyPageDTO getMyInfo(Long memberId, Long storeIdIgnored){
        Member member = myPageRepository.findById(memberId)
                .orElseThrow(() -> new AccessDeniedException("권한이 없습니다"));
        return MyPageDTO.fromEntity(member);
    }

    @Transactional
    public MyPageDTO updateMyPage(Long memberId, MyPageDTO dto) {
        Member member = myPageRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("회원이 존재하지 않습니다."));

        // 여기서 클라이언트가 보낸 id, email 은 사용하지 않는다
        if (dto.getName() != null) {
            member.setName(dto.getName());
        }
        if (dto.getPhone() != null) {
            member.setPhone(dto.getPhone());
        }
        if (dto.getMemberImagePath() != null) {
            member.setMemberImagePath(dto.getMemberImagePath());
        }

        return MyPageDTO.fromEntity(member);
    }

    /**
     * 비밀번호 변경
     *
     * <p>현재 비밀번호를 검증한 후 새 비밀번호를 암호화하여 저장한다.<br>
     *
     * @param memberId 로그인된 회원 ID
     * @param currentPassword 입력한 현재 비밀번호
     * @param newPassword 변경할 새 비밀번호
     * @throws IllegalArgumentException 현재 비밀번호 불일치 또는 회원 미존재 시 발생
     */
    //Spring Security의 {@link PasswordEncoder}를 사용한다.</p>
    @Transactional
    public void updatePassword(Long memberId, String currentPassword, String newPassword) {
        Member member = myPageRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("회원이 존재하지 않습니다."));

        if (!passwordEncoder.matches(currentPassword, member.getPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }
        member.setPassword(passwordEncoder.encode(newPassword));
    }

    /**
     * 비밀번호 검증
     *
     * <p>입력된 현재 비밀번호가 실제 회원 비밀번호와 일치하는지 확인한다.</p>
     *
     * @param memberId 로그인된 회원 ID
     * @param currentPassword 입력된 비밀번호
     * @return 일치 여부 (true = 일치, false = 불일치)
     * @throws IllegalArgumentException 회원이 존재하지 않을 경우 발생
     */
    @Transactional(readOnly = true)
    public boolean checkCurrentPassword(Long memberId, String currentPassword) {
        Member member = myPageRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("회원이 존재하지 않습니다."));

        return passwordEncoder.matches(currentPassword, member.getPassword());
    }

    @Transactional
    public void withdrawMember(Long memberId) {
        Member member = myPageRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("이미 탈퇴했거나 존재하지 않는 회원입니다."));

        // 상태 변경 (ACTIVE -> WITHDRAW)
        member.setStatus(MemberStatus.WITHDRAW);

        // 이메일 기준으로 refresh 토큰 삭제
        jwtService.removeRefreshUser(member.getEmail());
    }

    // 상단 정보S
    @Transactional
    public MyPageDTO getMyPro(Long memberId) {
        StaffProfile staff = staffRepository
                .findById(memberId)      // 이미 있는 쿼리라고 가정
                .orElseThrow(() -> new RuntimeException("프로필 없음"));

        return MyPageDTO.builder()
                .id(staff.getId())
                .name(staff.getStaffName())
                .email(staff.getStaffEmail())
                .storeName(staff.getStore().getName())
                .employmentType(String.valueOf(staff.getStaffEmploymentType()))
                .build();
    }

}
