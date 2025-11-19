package com.boot.ict05_final_user.domain.inventory.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

/**
 * 가맹점 입고 커스텀 구현
 * 현재는 빈 구현
 */
@Repository
@RequiredArgsConstructor
public class StoreInventoryInRepositoryImpl implements StoreInventoryInRepositoryCustom {
    // JPAQueryFactory 주입 후 확장 메서드 작성 가능
}
