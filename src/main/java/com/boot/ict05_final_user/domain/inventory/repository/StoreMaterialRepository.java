package com.boot.ict05_final_user.domain.inventory.repository;


import com.boot.ict05_final_user.domain.inventory.entity.Material;
import com.boot.ict05_final_user.domain.inventory.entity.StoreMaterial;
import com.boot.ict05_final_user.domain.store.entity.Store;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreMaterialRepository extends JpaRepository<StoreMaterial, Long> {

    boolean existsByStoreAndCode(Store store, String code);
    boolean existsByStoreAndMaterial(Store store, Material material);

    // 필요하면: 가맹점 한 개 기준 목록 조회
    // Page<StoreMaterial> findByStore(Store store, Pageable pageable);
}
