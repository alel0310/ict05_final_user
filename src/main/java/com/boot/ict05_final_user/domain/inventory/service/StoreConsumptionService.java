package com.boot.ict05_final_user.domain.inventory.service;

import com.boot.ict05_final_user.domain.inventory.dto.StoreConsumeRequestDTO;
import com.boot.ict05_final_user.domain.inventory.entity.InventoryRecordStatus;
import com.boot.ict05_final_user.domain.inventory.entity.StoreInventory;
import com.boot.ict05_final_user.domain.inventory.entity.StoreInventoryOut;
import com.boot.ict05_final_user.domain.inventory.entity.StoreMaterial;
import com.boot.ict05_final_user.domain.inventory.repository.StoreInventoryOutRepository;
import com.boot.ict05_final_user.domain.inventory.repository.StoreInventoryRepository;
import com.boot.ict05_final_user.domain.inventory.repository.StoreMaterialRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * 판매 소진 트랜잭션 서비스
 * 입력은 이미 정규화된 가맹점 재료 기준 소진 라인이다
 * 단위 변환과 레시피 조회는 수행하지 않는다
 */
@Service
@RequiredArgsConstructor
public class StoreConsumptionService {

    private final StoreInventoryRepository storeInventoryRepository;
    private final StoreInventoryOutRepository storeInventoryOutRepository;
    private final StoreMaterialRepository storeMaterialRepository;

    @Transactional
    public void consume(final Long storeId, final StoreConsumeRequestDTO request) {
        Objects.requireNonNull(storeId, "storeId must not be null");
        Objects.requireNonNull(request, "request must not be null");

        final LocalDateTime eventAt = Optional.ofNullable(request.getSaleAt()).orElseGet(LocalDateTime::now);

        final List<StoreConsumeRequestDTO.Line> lines = request.getLines();
        if (lines == null || lines.isEmpty()) return;

        // 선검증 음수 재고 방지
        for (StoreConsumeRequestDTO.Line line : lines) {
            final StoreInventory inv = findInventoryByStoreMaterialId(storeId, line.getStoreMaterialId());
            final BigDecimal current = nz(inv.getQuantity());
            if (current.compareTo(line.getQuantity()) < 0) {
                throw new IllegalStateException("재고 부족. storeMaterialId=" + line.getStoreMaterialId()
                        + ", current=" + current + ", required=" + line.getQuantity());
            }
        }

        // 차감 및 이력
        for (StoreConsumeRequestDTO.Line line : lines) {
            final Long storeMaterialId = line.getStoreMaterialId();
            final BigDecimal outQty = scale3(line.getQuantity());

            final StoreInventory inv = findInventoryByStoreMaterialId(storeId, storeMaterialId);
            final BigDecimal before = nz(inv.getQuantity());
            final BigDecimal after = before.subtract(outQty);
            if (after.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalStateException("재고 부족. 경합 발생. storeMaterialId=" + storeMaterialId
                        + ", before=" + before + ", out=" + outQty);
            }

            inv.setQuantity(after);
            storeInventoryRepository.save(inv);

            // 단가는 매장 판매가 이력 관리 대상이 아님
            final StoreInventoryOut out = StoreInventoryOut.builder()
                    .store(inv.getStore())
                    .storeMaterial(inv.getStoreMaterial())
                    .quantity(outQty)
                    .stockAfter(after)
                    .unitPrice(null)
                    .memo(Optional.ofNullable(request.getMemo()).orElse("SALE"))
                    .outDate(eventAt)
                    .status(InventoryRecordStatus.CONFIRMED)
                    .build();
            storeInventoryOutRepository.save(out);
        }
    }

    private StoreInventory findInventoryByStoreMaterialId(final Long storeId, final Long storeMaterialId) {
        final StoreMaterial sm = storeMaterialRepository.findById(storeMaterialId)
                .orElseThrow(() -> new EntityNotFoundException("StoreMaterial not found. id=" + storeMaterialId));
        if (!sm.getStore().getId().equals(storeId)) {
            throw new EntityNotFoundException("StoreMaterial의 매장 불일치. storeId=" + storeId + ", storeMaterialId=" + storeMaterialId);
        }
        return storeInventoryRepository.findByStoreIdAndStoreMaterialId(storeId, storeMaterialId)
                .orElseThrow(() -> new EntityNotFoundException("StoreInventory not found. storeId=" + storeId + ", storeMaterialId=" + storeMaterialId));
    }

    private static BigDecimal nz(final BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    private static BigDecimal scale3(final BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v.setScale(3, RoundingMode.HALF_UP);
    }
}
