package com.boot.ict05_final_user.domain.inventory.service;

import com.boot.ict05_final_user.domain.inventory.dto.StoreInventoryListDTO;
import com.boot.ict05_final_user.domain.inventory.dto.StoreInventoryRestockRequest;
import com.boot.ict05_final_user.domain.inventory.dto.StoreInventoryRestockResponse;
import com.boot.ict05_final_user.domain.inventory.entity.InventoryStatus;
import com.boot.ict05_final_user.domain.inventory.entity.MaterialStatus;
import com.boot.ict05_final_user.domain.inventory.entity.StoreInventory;
import com.boot.ict05_final_user.domain.inventory.entity.StoreMaterial;
import com.boot.ict05_final_user.domain.inventory.repository.StoreInventoryRepository;
import com.boot.ict05_final_user.domain.inventory.repository.StoreMaterialRepository;
import com.boot.ict05_final_user.domain.store.entity.Store;
import com.boot.ict05_final_user.domain.store.repository.StoreRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static java.math.BigDecimal.ZERO;
import java.util.List;

/*
 * 변경 요약 (2025-11-25)
 * - Javadoc 정리: 역할/계약/예외/트랜잭션 명시, 문장형/마침표 통일.
 * - initInventoryForStore에서 초기 상태 주석을 명확화(실제 상태는 touchAfterQuantityChange로 확정).
 * - 재고 상태 재계산(recalcStatus) 규칙을 명시적으로 문서화.
 */

/**
 * 가맹점 집계 재고 조회/초기화/간단 입고 서비스.
 *
 * <p>역할</p>
 * <ul>
 *   <li>가맹점의 집계 재고({@link StoreInventory}) 목록 조회.</li>
 *   <li>매장에 존재하는 모든 {@link StoreMaterial} 기준, 누락된 집계 재고를 수량 0으로 초기 생성.</li>
 *   <li>간단 입고 처리(수량 가산) 및 상태/업데이트 일시 동기화.</li>
 * </ul>
 *
 * <p>규칙</p>
 * <ul>
 *   <li>수량 스케일은 도메인 공통 정책을 따르며, 본 클래스는 스케일 조정 로직을 포함하지 않는다.</li>
 *   <li>상태 재계산은 {@link StoreInventory#touchAfterQuantityChange()}에 위임한다
 *       (현재고 vs 적정재고 비교로 {@link InventoryStatus} 갱신, updateDate 동기화).</li>
 *   <li>배치/로트, 단가 이력, 유통기한 등은 다루지 않는다(간단 가산 전용).</li>
 * </ul>
 *
 * <p>트랜잭션</p>
 * <ul>
 *   <li>조회: {@code readOnly}.</li>
 *   <li>쓰기(init, restock): 단일 트랜잭션으로 커밋.</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StoreInventoryService {

    private final StoreRepository storeRepository;
    private final StoreMaterialRepository storeMaterialRepository;
    private final StoreInventoryRepository storeInventoryRepository;

    /**
     * 지정 매장의 집계 재고 목록을 조회한다.
     *
     * <p>주의</p>
     * <ul>
     *   <li>존재하지 않는 매장에 대해서도 빈 목록이 반환될 수 있다. 매장 존재 검증이 필요하면 상위 계층에서 별도 처리한다.</li>
     * </ul>
     *
     * @param storeId 매장 ID.
     * @return {@link StoreInventoryListDTO} 목록.
     */
    @Transactional(readOnly = true)
    public List<StoreInventoryListDTO> getStoreInventoryList(Long storeId) {
        List<StoreInventory> list = storeInventoryRepository.findByStore_Id(storeId);
        return list.stream()
                .map(StoreInventoryListDTO::from)
                .toList();
    }

    /**
     * 지정 매장의 모든 {@link StoreMaterial}에 대해, 집계 재고가 없으면 quantity=0으로 생성한다.
     *
     * <p>처리 흐름</p>
     * <ol>
     *   <li>매장 존재 검증.</li>
     *   <li>매장에 속한 모든 StoreMaterial 조회.</li>
     *   <li>각 재료에 대해 StoreInventory 존재 여부 검사 → 없으면 신규 생성(수량 0, optimalQuantity 초기화).</li>
     *   <li>{@link StoreInventory#touchAfterQuantityChange()} 호출로 상태 및 업데이트 일시 동기화.</li>
     * </ol>
     *
     * @param storeId 매장 ID.
     * @return 새로 생성된 {@link StoreInventory} 개수.
     * @throws IllegalArgumentException 매장이 존재하지 않을 때.
     */
    @Transactional
    public int initInventoryForStore(Long storeId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 매장: " + storeId));

        List<StoreMaterial> materials = storeMaterialRepository.findByStore(store);

        int created = 0;
        for (StoreMaterial sm : materials) {
            boolean exists = storeInventoryRepository.existsByStoreAndStoreMaterial(store, sm);
            if (exists) continue;

            StoreInventory inv = StoreInventory.builder()
                    .store(store)
                    .storeMaterial(sm)
                    .quantity(ZERO)
                    .optimalQuantity(sm.getOptimalQuantity())
                    .status(InventoryStatus.SHORTAGE) // 초기값. 실제 값은 touchAfterQuantityChange에서 재계산.
                    .build();

            // 상태/업데이트일시 동기화(적정재고 대비 상태 결정).
            inv.touchAfterQuantityChange();
            storeInventoryRepository.save(inv);
            created++;
        }
        return created;
    }

    /**
     * 가맹점 재고 간단 입고 처리(수량 가산).
     *
     * <p>처리 흐름</p>
     * <ol>
     *   <li>StoreInventory 조회(예외: 미존재).</li>
     *   <li>현재 수량 + 요청 수량 가산.</li>
     *   <li>{@link StoreInventory#touchAfterQuantityChange()} 호출로 상태/업데이트일시 동기화.</li>
     *   <li>집계 결과를 응답 DTO로 반환.</li>
     * </ol>
     *
     * <p>주의</p>
     * <ul>
     *   <li>단가/배치/유통기한/원가는 별도 유스케이스에서 처리한다.</li>
     * </ul>
     *
     * @param request 재고 입고 요청(집계 재고 ID, 수량, 기타 메모 등).
     * @return 입고 처리 후 집계 결과 응답.
     * @throws EntityNotFoundException 대상 집계 재고가 없을 때.
     * @throws IllegalStateException 미사용(STOP) 재료일 때.
     */
    @Transactional
    public StoreInventoryRestockResponse restock(StoreInventoryRestockRequest request) {

        StoreInventory inventory = storeInventoryRepository.findById(request.getStoreInventoryId())
                .orElseThrow(() ->
                        new EntityNotFoundException("가맹점 재고를 찾을 수 없습니다. id=" + request.getStoreInventoryId()));

        // STOP(미사용) 재료는 수량 변경 금지.
        assertUsable(inventory.getStoreMaterial());

        BigDecimal before = inventory.getQuantity() != null ? inventory.getQuantity() : ZERO;
        BigDecimal add = request.getQuantity() != null ? request.getQuantity() : ZERO;

        // 수량 가산.
        inventory.setQuantity(before.add(add));
        // 상태 + updateDate 동기화(적정재고 vs 현재고).
        inventory.touchAfterQuantityChange();

        StoreMaterial sm = inventory.getStoreMaterial();

        return new StoreInventoryRestockResponse(
                inventory.getId(),
                inventory.getStore().getId(),
                sm.getId(),
                inventory.getQuantity(),
                inventory.getStatus()
        );
    }

    /**
     * 수량(qty)과 적정재고(optimalQuantity) 비교 기반의 상태 재계산 규칙.
     *
     * <ul>
     *   <li>qty == 0 → {@code SHORTAGE}.</li>
     *   <li>optimal == null 또는 optimal <= 0 → {@code SUFFICIENT}.</li>
     *   <li>0 < qty < optimal → {@code LOW}.</li>
     *   <li>qty >= optimal → {@code SUFFICIENT}.</li>
     * </ul>
     *
     * <p>저장은 호출 측에서 수행한다(본 메서드는 set만 담당).</p>
     *
     * @param si 집계 재고 엔티티.
     */
    public void recalcStatus(StoreInventory si) {
        BigDecimal qty = n(si.getQuantity());
        BigDecimal opt = si.getOptimalQuantity();

        if (qty.signum() == 0) {
            si.setStatus(InventoryStatus.SHORTAGE);
            return;
        }
        if (opt == null || opt.signum() <= 0) {
            si.setStatus(InventoryStatus.SUFFICIENT);
            return;
        }
        if (qty.compareTo(opt) < 0) {
            si.setStatus(InventoryStatus.LOW);
        } else {
            si.setStatus(InventoryStatus.SUFFICIENT);
        }
    }

    /** BigDecimal null-safe. */
    private static BigDecimal n(BigDecimal v) {
        return v == null ? ZERO : v;
    }

    /**
     * STOP(미사용) 재료 작업 차단 가드.
     * 입고/조정 등 수량 변경 전 반드시 호출한다.
     *
     * @param sm 가맹점 재료 엔티티.
     * @throws IllegalStateException 미사용(STOP) 재료일 때.
     */
    private void assertUsable(final StoreMaterial sm) {
        if (sm != null && sm.getStatus() == MaterialStatus.STOP) {
            throw new IllegalStateException(
                    "미사용 재료는 입고/재고조정을 수행할 수 없습니다. storeMaterialId=" + sm.getId()
            );
        }
    }
}
