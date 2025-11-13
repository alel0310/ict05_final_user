package com.boot.ict05_final_user.domain.myPage.dto;

import com.boot.ict05_final_user.domain.user.entity.Member;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MyPageDTO {

    /** 회원 ID */
    private Long id;

    /** 회원 이름 */
    private String name;

    /** 회원 이메일 */
    private String email;

    /** 회원 전화번호 */
    private String phone;

    /** 회원 프로필 이미지 경로 */
    private String memberImagePath;

    /** 지점명 */
    private String storeName;

    /** 근무형태 */
    private String employmentType;

    /**
     * Entity → DTO 변환 메서드
     */
    public static MyPageDTO fromEntity(Member member) {
        return MyPageDTO.builder()
                .id(member.getId())
                .name(member.getName())
                .email(member.getEmail())
                .phone(member.getPhone())
                .memberImagePath(member.getMemberImagePath())
                .build();
    }
}
