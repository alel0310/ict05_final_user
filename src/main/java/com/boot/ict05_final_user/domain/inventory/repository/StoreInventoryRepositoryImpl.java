package com.boot.ict05_final_user.domain.inventory.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

/**
 * 가맹점 재고 커스텀 구현
 *
 * 현재는 확장 포인트만 두고 빈 구현 상태
 */
@Repository
@RequiredArgsConstructor
public class StoreInventoryRepositoryImpl implements StoreInventoryRepositoryCustom {
    // JPAQueryFactory 등 의존성 주입 후 커스텀 메서드 구현 예정
}
