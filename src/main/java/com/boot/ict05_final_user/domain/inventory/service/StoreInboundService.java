package com.boot.ict05_final_user.domain.inventory.service;

import com.boot.ict05_final_user.domain.inventory.dto.StoreInventoryInWriteDTO;
import com.boot.ict05_final_user.domain.inventory.entity.*;
import com.boot.ict05_final_user.domain.inventory.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StoreInboundService {

    private final StoreInventoryRepository storeInventoryRepository;
    private final StoreMaterialRepository storeMaterialRepository;
    private final StoreInventoryInRepository storeInventoryInRepository;
    private final UnitPriceJdbcRepository unitPriceJdbcRepository; // ← 교체

    @Transactional
    public Long inbound(Long storeId, StoreInventoryInWriteDTO dto) {
        // 1) 검증/로딩
        StoreInventory inv = storeInventoryRepository.findById(dto.getStoreInventoryId())
                .orElseThrow(() -> new IllegalArgumentException("재고가 존재하지 않습니다."));
        if (!inv.getStore().getId().equals(storeId)) {
            throw new IllegalArgumentException("해당 재고에 대한 권한이 없습니다.");
        }

        StoreMaterial sm = storeMaterialRepository.findByIdAndStore_Id(dto.getStoreMaterialId(), storeId)
                .orElseThrow(() -> new IllegalArgumentException("재료가 존재하지 않거나 권한이 없습니다."));

        // 2) 단가 해석
        BigDecimal resolvedUnitPrice = resolveUnitPrice(sm, dto);

        // 3) 입고 행 저장 (판매가 필드 제거)
        StoreInventoryIn in = StoreInventoryIn.builder()
                .store(inv.getStore())
                .storeMaterial(sm)
                .quantity(BigDecimal.valueOf(dto.getQuantity()))
                .memo(dto.getMemo())
                .unitPrice(resolvedUnitPrice)                // 입고 단가
                .stockAfter(inv.getQuantity())               // increase 이후 값
                .inDate(LocalDateTime.now())                 // 명시 세팅
                .build();
        storeInventoryInRepository.save(in);

        // 4) 재고 수량 증가
        inv.increase(BigDecimal.valueOf(dto.getQuantity()));

        // 5) (정책) 단가 이력 적재 등 있으면 처리
        // storeUnitPriceRepository.save(...);

        return in.getId();
    }

    private BigDecimal resolveUnitPrice(StoreMaterial sm, StoreInventoryInWriteDTO dto) {
        // 0) 클라이언트 입력이 있으면 최우선 사용
        if (dto.getUnitPrice() != null) {
            if (dto.getUnitPrice() < 0) throw new IllegalArgumentException("입고 단가는 0 이상이어야 합니다.");
            return BigDecimal.valueOf(dto.getUnitPrice());
        }

        boolean isHq = (sm.getMaterial() != null);

        // 1) HQ 재료라면: unit_price SELLING 최신가 시도
        if (isHq) {
            Optional<BigDecimal> selling = unitPriceJdbcRepository
                    .findLatestSellingPriceByMaterialId(sm.getMaterial().getId());
            if (selling.isPresent()) return selling.get();

            // 2) HQ 판매가가 비어있으면: "가맹점 최근 입고 단가"로 보정
            Optional<BigDecimal> lastStoreIn = storeInventoryInRepository
                    .findLatestUnitPriceByStoreMaterialId(sm.getId());
            if (lastStoreIn.isPresent()) return lastStoreIn.get();

            // 3) 여기까지 없으면 입력 요구
            // HQ 재료일 때:
            return unitPriceJdbcRepository
                    .findLatestSellingPriceByMaterialId(sm.getMaterial().getId())
                    .orElseThrow(() -> new IllegalArgumentException("본사 판매가가 설정되지 않았습니다. 입고 단가를 입력하세요."));
        }

        // 4) 가맹점 자체 재료: 최근 입고 단가로 보정, 없으면 입력 요구
        return storeInventoryInRepository.findLatestUnitPriceByStoreMaterialId(sm.getId())
                .orElseThrow(() -> new IllegalArgumentException("입고 단가를 입력하세요."));
    }


}
