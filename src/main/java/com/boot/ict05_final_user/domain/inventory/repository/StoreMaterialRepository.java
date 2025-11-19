package com.boot.ict05_final_user.domain.inventory.repository;


import com.boot.ict05_final_user.domain.inventory.entity.Material;
import com.boot.ict05_final_user.domain.inventory.entity.StoreMaterial;
import com.boot.ict05_final_user.domain.store.entity.Store;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoreMaterialRepository extends JpaRepository<StoreMaterial, Long> {

    boolean existsByStoreAndCode(Store store, String code);
    boolean existsByStoreAndMaterial(Store store, Material material);

    // 필요하면: 가맹점 한 개 기준 목록 조회
    // Page<StoreMaterial> findByStore(Store store, Pageable pageable);

    // 가맹점 재료 조회
    List<StoreMaterial> findByStore(Store store);

    // 스토어 + HQ 재료 PK로 조회 (연관 필드명: material)
    Optional<StoreMaterial> findByStore_IdAndMaterial_Id(Long storeId, Long materialId);

    // 필요하면 가맹점 재료 PK로 찾는 버전도 병행
    Optional<StoreMaterial> findByStore_IdAndId(Long storeId, Long storeMaterialId);

    Optional<StoreMaterial> findById(Long id);
}
