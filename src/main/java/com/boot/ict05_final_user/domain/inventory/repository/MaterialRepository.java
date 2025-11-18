package com.boot.ict05_final_user.domain.inventory.repository;

import com.boot.ict05_final_user.domain.inventory.entity.Material;
import com.boot.ict05_final_user.domain.inventory.entity.MaterialStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaterialRepository  extends JpaRepository<Material, Long>, MaterialRepositoryCustom {
    List<Material> findByMaterialStatus(MaterialStatus status);   // USE 만 가져오고 싶으면
}
