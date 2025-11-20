package com.boot.ict05_final_user.domain.menu.service;

import com.boot.ict05_final_user.domain.inventory.entity.StoreMaterial;
import com.boot.ict05_final_user.domain.inventory.repository.StoreMaterialRepository;
import com.boot.ict05_final_user.domain.menu.entity.MenuUsageMaterialLog;
import com.boot.ict05_final_user.domain.menu.repository.MenuUsageMaterialLogRepository;
import com.boot.ict05_final_user.domain.order.entity.CustomerOrder;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;

// 실제로 "얼마를 사용했는지"를 기록하고 합계 조회를 도와주는 서비스
@Service
@RequiredArgsConstructor
public class MenuUsageMaterialLogService {

    private final MenuUsageMaterialLogRepository logRepo;
    private final StoreMaterialRepository storeMaterialRepo; // ✅ 추가: 재료 FK를 채우려면 필요

    @Transactional
    public void logDeduct(CustomerOrder order,
                          Map<Long, BigDecimal> needByMaterialId,
                          String correlationId) {

        Long storeId = order.getStore().getId(); // 매장 id

        for (Map.Entry<Long, BigDecimal> e : needByMaterialId.entrySet()) {
            Long materialId = e.getKey();          // 재료 id
            BigDecimal qty = e.getValue();         // 사용 수량

            // 1) 매장-재료 FK 찾아오기 (없으면 예외)
            StoreMaterial sm = storeMaterialRepo
                    .findByStore_IdAndMaterial_Id(storeId, materialId)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "StoreMaterial not found. storeId=" + storeId + ", materialId=" + materialId));

            // 2) 단위 채우기 (Material 기본단위가 있다면 그걸 쓰세요)
            //    예: sm.getMaterial().getBaseUnit().name()
            String unit = "BASE"; // 임시. 실제로는 material 기본단위 문자열을 넣는 걸 추천

            // 3) 로그 엔티티 구성 (엔티티 구조에 맞게 FK 레퍼런스 주입)
            MenuUsageMaterialLog log = MenuUsageMaterialLog.builder()
                    .customerOrderFk(order)          // 주문 엔티티
                    .menuFk(null)                    // 메뉴를 특정하지 않는다면 null (위에서 nullable로 바꿨다면 가능)
                    .storeMaterialFk(sm)             // 매장-재료 FK
                    .count(qty)                      // 수량
                    .unit(unit)                      // 단위 문자열
                    .memo(correlationId)             // 상관키를 메모에 남김(전용 컬럼 없으니 임시로)
                    .build();

            // 4) 저장
            logRepo.save(log);
        }
    }
}


