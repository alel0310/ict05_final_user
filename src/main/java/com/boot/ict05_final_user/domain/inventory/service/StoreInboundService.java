package com.boot.ict05_final_user.domain.inventory.service;

import com.boot.ict05_final_user.domain.inventory.dto.StoreInventoryInWriteDTO;
import com.boot.ict05_final_user.domain.inventory.entity.InventoryRecordStatus;
import com.boot.ict05_final_user.domain.inventory.entity.StoreInventory;
import com.boot.ict05_final_user.domain.inventory.entity.StoreInventoryIn;
import com.boot.ict05_final_user.domain.inventory.entity.StoreMaterial;
import com.boot.ict05_final_user.domain.inventory.entity.StoreUnitPrice;
import com.boot.ict05_final_user.domain.inventory.entity.UnitPriceType;
import com.boot.ict05_final_user.domain.inventory.repository.StoreInventoryInRepository;
import com.boot.ict05_final_user.domain.inventory.repository.StoreInventoryRepository;
import com.boot.ict05_final_user.domain.inventory.repository.StoreMaterialRepository;
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

    private final StoreInventoryInRepository storeInventoryInRepository;
    private final StoreMaterialRepository storeMaterialRepository;
    private final StoreInventoryRepository storeInventoryRepository;

    @Transactional
    public Long inbound(final Long storeId, final StoreInventoryInWriteDTO req) {
        Objects.requireNonNull(storeId, "storeId must not be null");
        Objects.requireNonNull(req, "request must not be null");

        final Long storeMaterialId = req.getStoreMaterialId();
        final BigDecimal inQty = scale3(req.getQuantity());
        final BigDecimal unitPrice = scale2(req.getUnitPrice());
        final LocalDateTime inAt = Optional.ofNullable(req.getInDate()).orElseGet(LocalDateTime::now);

        final StoreMaterial sm = storeMaterialRepository.findById(storeMaterialId)
                .orElseThrow(() -> new EntityNotFoundException("StoreMaterial not found. id=" + storeMaterialId));
        if (!sm.getStore().getId().equals(storeId)) {
            throw new EntityNotFoundException("StoreMaterial store mismatch. storeId=" + storeId + ", storeMaterialId=" + storeMaterialId);
        }

        final StoreInventory inv = storeInventoryRepository.findByStoreIdAndStoreMaterialId(storeId, storeMaterialId)
                .orElseThrow(() -> new EntityNotFoundException("StoreInventory not found. storeId=" + storeId + ", storeMaterialId=" + storeMaterialId));

        // 재고 증가
        final BigDecimal before = nz(inv.getQuantity());
        final BigDecimal after = before.add(inQty);
        inv.setQuantity(after);
        storeInventoryRepository.save(inv);

        // 입고 이력
        final StoreInventoryIn in = StoreInventoryIn.builder()
                .store(sm.getStore())
                .storeMaterial(sm)
                .quantity(inQty)
                .stockAfter(after)
                .unitPrice(unitPrice)
                .refHqOutId(req.getRefHqOutId())
                .inDate(inAt)
                .memo(Optional.ofNullable(req.getMemo()).orElse("INBOUND"))
                .status(InventoryRecordStatus.CONFIRMED)
                .build();
        storeInventoryInRepository.save(in);

        return in.getId();
    }

    private static BigDecimal nz(final BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    private static BigDecimal nz2(final BigDecimal v) {
        return v == null ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : v;
    }

    private static BigDecimal scale3(final BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v.setScale(3, RoundingMode.HALF_UP);
    }

    private static BigDecimal scale2(final BigDecimal v) {
        return v == null ? null : v.setScale(2, RoundingMode.HALF_UP);
    }
}
