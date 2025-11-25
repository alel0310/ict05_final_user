package com.boot.ict05_final_user.domain.inventory.repository;

import com.boot.ict05_final_user.domain.inventory.entity.Material;
import com.boot.ict05_final_user.domain.inventory.entity.StoreMaterial;
import com.boot.ict05_final_user.domain.store.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/*
 * 변경 요약 (2025-11-25)
 * - Javadoc 정리: 역할/계약/파라미터/반환 설명 보강, 문장형 및 마침표 통일.
 * - 비관적 잠금 메서드(findByIdAndStoreIdForUpdate) 목적/타임아웃 명시.
 * - 파생 쿼리 메서드의 의도를 명확히 기술.
 */

/**
 * 가맹점 재료(StoreMaterial) 리포지토리.
 *
 * <p>정책</p>
 * <ul>
 *   <li>파생 메서드 네이밍은 엔티티 필드명과 동일하게 유지한다.</li>
 *   <li>소유 매장 검증이 필요한 조회는 {@code store.id} 조건을 함께 사용한다.</li>
 * </ul>
 *
 * <p>주요 메서드</p>
 * <ul>
 *   <li>소유 매장 검증 포함 단건 조회 → {@link #findByIdAndStore_Id(Long, Long)}.</li>
 *   <li>HQ 재료 매핑 중복 체크 → {@link #existsByStoreAndMaterial(Store, Material)}.</li>
 *   <li>가맹점 자체 코드 중복 체크 → {@link #existsByStoreAndCode(Store, String)}.</li>
 *   <li>매장 전체 목록 → {@link #findByStore(Store)}.</li>
 *   <li>매장+HQ재료 단건 조회 → {@link #findByStore_IdAndMaterial_Id(Long, Long)}.</li>
 * </ul>
 */
@Repository
public interface StoreMaterialRepository extends JpaRepository<StoreMaterial, Long> {

    /** 가맹점 자체 코드 중복 여부를 확인한다. */
    boolean existsByStoreAndCode(Store store, String code);

    /** HQ 재료 매핑 중복 여부를 확인한다. */
    boolean existsByStoreAndMaterial(Store store, Material material);

    /** 매장 기준 전체 목록을 조회한다. */
    List<StoreMaterial> findByStore(Store store);

    /**
     * 소유 매장 검증을 포함하여 단건을 조회한다.
     *
     * <p>전제: {@code Store}의 식별자 필드명은 {@code id}.</p>
     *
     * @param id      store_material PK.
     * @param storeId store PK.
     * @return 일치 항목이 존재하면 {@code Optional}로 반환한다.
     */
    Optional<StoreMaterial> findByIdAndStore_Id(Long id, Long storeId);

    /**
     * 매장 + HQ 재료 기준으로 단건을 조회한다.
     *
     * @param storeId    store PK.
     * @param materialId hq material PK.
     * @return 일치 항목이 존재하면 {@code Optional}로 반환한다.
     */
    Optional<StoreMaterial> findByStore_IdAndMaterial_Id(Long storeId, Long materialId);

    /**
     * 상세 설정 저장 등 경합 구간에서 사용할 비관적 쓰기 잠금 조회.
     *
     * <p>계약</p>
     * <ul>
     *   <li>동일 매장 소유 검증을 수행한다.</li>
     *   <li>잠금 타임아웃은 5초(5000ms)이다.</li>
     * </ul>
     *
     * @param id      store_material PK.
     * @param storeId store PK.
     * @return 잠금이 획득된 엔티티를 {@code Optional}로 반환한다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "5000"))
    @Query("""
        select sm
        from StoreMaterial sm
        where sm.id = :id
          and sm.store.id = :storeId
    """)
    Optional<StoreMaterial> findByIdAndStoreIdForUpdate(@Param("id") Long id, @Param("storeId") Long storeId);
}
