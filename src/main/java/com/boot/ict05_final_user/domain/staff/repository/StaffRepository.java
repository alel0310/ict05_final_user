package com.boot.ict05_final_user.domain.staff.repository;

import com.boot.ict05_final_user.domain.staff.entity.StaffProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * StaffProfile 엔티티용 Spring Data JPA 리포지토리 인터페이스.
 *
 * <p>특징</p>
 * <ul>
 *   <li>{@link JpaRepository} 상속: 기본 CRUD, 페이징/정렬 메서드 자동 제공</li>
 *   <li>{@code StaffRepositoryCustom} 상속: 복잡한 동적쿼리/커스텀 메서드 구현 분리</li>
 * </ul>
 */

public interface StaffRepository extends JpaRepository<StaffProfile, Long>, StaffRepositoryCustom {

    // 마이페이지용: member_id 로 StaffProfile 찾기
    Optional<StaffProfile> findByMember_Id(Long memberId);

    // 로그인 성공 시 지점 이름용(Lazy 터지던 부분)
    @Query("select s.store.name from StaffProfile s " +
            "join s.store " +
            "where s.member.email = :email")
    Optional<String> findStoreNameByMemberEmail(@Param("email") String email);
}
