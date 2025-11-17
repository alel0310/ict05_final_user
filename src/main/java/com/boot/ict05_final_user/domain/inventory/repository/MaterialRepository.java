package com.boot.ict05_final_user.domain.inventory.repository;

import com.boot.ict05_final_user.domain.inventory.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MaterialRepository  extends JpaRepository<Material, Long>, MaterialRepositoryCustom {
}
