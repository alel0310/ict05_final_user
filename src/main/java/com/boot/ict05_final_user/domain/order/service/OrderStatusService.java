package com.boot.ict05_final_user.domain.order.service;

import com.boot.ict05_final_user.domain.inventory.dto.StoreConsumeRequestDTO;
import com.boot.ict05_final_user.domain.inventory.repository.StoreMaterialRepository;
import com.boot.ict05_final_user.domain.inventory.service.StoreConsumptionService;
import com.boot.ict05_final_user.domain.menu.service.MenuUsageCalculator;
import com.boot.ict05_final_user.domain.menu.service.MenuUsageMaterialLogService;
import com.boot.ict05_final_user.domain.order.entity.CustomerOrder;
import com.boot.ict05_final_user.domain.order.entity.OrderStatus;
import com.boot.ict05_final_user.domain.order.repository.CustomerOrderRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OrderStatusService {

    private final CustomerOrderRepository orderRepo;                 // 주문 저장소
    private final MenuUsageCalculator usageCalculator;               // 레시피 기반 필요 수량 계산기
    private final StoreConsumptionService storeConsumptionService;   // 재고 차감(판매 소진)
    private final StoreMaterialRepository storeMaterialRepository;   // materialId -> storeMaterialId 매핑
    private final MenuUsageMaterialLogService usageLogService;       // 사용 로그 기록

    @Transactional
    public void updateStatus(Long orderId, OrderStatus next) {
        CustomerOrder order = orderRepo.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("order not found: " + orderId));

        OrderStatus prev = order.getStatus();
        order.setStatus(next);

        if (prev == OrderStatus.PREPARING && next == OrderStatus.COOKING) {
            applyUsage(order); // 조리 시작 시 재고 차감
        }
    }

    // ====== 차감 ======
    private void applyUsage(CustomerOrder order) {
        // 1) 주문 전체 필요 재료 합계 (materialId -> 총필요수량)
        Map<Long, BigDecimal> need = usageCalculator.calcMaterialsForOrder(order);

        // 2) 상관키 (멱등/추적용)
        String corr = "ORDER-" + order.getId();

        // 3) StoreConsumptionService 가 요구하는 DTO로 변환해서 호출
        Long storeId = order.getStore().getId();
        StoreConsumeRequestDTO req = toConsumeRequest(storeId, need, corr);
        storeConsumptionService.consume(storeId, req);

        // 4) 사용 로그 기록(나중에 롤백/정산에 필요)
        usageLogService.logDeduct(order, need, corr);
    }

    /**
     * materialId->qty 맵을 StoreConsumptionService 가 받는
     * storeMaterialId->qty 라인 리스트로 변환
     */
    private StoreConsumeRequestDTO toConsumeRequest(Long storeId,
                                                    Map<Long, BigDecimal> need,
                                                    String correlationId) {

        StoreConsumeRequestDTO dto = new StoreConsumeRequestDTO();
        dto.setSaleAt(LocalDateTime.now());                // 이벤트 시각
        dto.setMemo("ORDER " + correlationId);             // 메모로 상관키 남김

        List<StoreConsumeRequestDTO.Line> lines = new ArrayList<>();

        for (Map.Entry<Long, BigDecimal> e : need.entrySet()) {
            Long materialId = e.getKey();                  // 본사 재료 PK
            BigDecimal qty = e.getValue();                 // 필요 수량

            // storeId + materialId -> storeMaterialId 조회 (없으면 예외)
            Long storeMaterialId = storeMaterialRepository
                    .findByStore_IdAndMaterial_Id(storeId, materialId)
                    .orElseThrow(() ->
                            new IllegalArgumentException("StoreMaterial not found. storeId="
                                    + storeId + ", materialId=" + materialId))
                    .getId();

            // DTO 라인 구성
            StoreConsumeRequestDTO.Line line = new StoreConsumeRequestDTO.Line();
            line.setStoreMaterialId(storeMaterialId);
            line.setQuantity(qty);

            lines.add(line);
        }

        dto.setLines(lines);
        return dto;
    }
}
