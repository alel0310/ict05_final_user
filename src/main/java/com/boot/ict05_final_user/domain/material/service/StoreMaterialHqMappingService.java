package com.boot.ict05_final_user.domain.material.service;

import com.boot.ict05_final_user.domain.inventory.entity.*;
import com.boot.ict05_final_user.domain.inventory.repository.MaterialRepository;
import com.boot.ict05_final_user.domain.inventory.repository.StoreInventoryRepository;
import com.boot.ict05_final_user.domain.inventory.repository.StoreMaterialRepository;
import com.boot.ict05_final_user.domain.material.entity.Material;
import com.boot.ict05_final_user.domain.material.entity.MaterialStatus;
import com.boot.ict05_final_user.domain.material.entity.StoreMaterial;
import com.boot.ict05_final_user.domain.store.entity.Store;
import com.boot.ict05_final_user.domain.store.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class StoreMaterialHqMappingService {


}

