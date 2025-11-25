package com.boot.ict05_final_user.domain.inventory.controller;

import com.boot.ict05_final_user.config.security.principal.AppUser;
import com.boot.ict05_final_user.domain.inventory.dto.*;
import com.boot.ict05_final_user.domain.inventory.service.StoreMaterialService;

import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/*
 * 변경 요약 (2025-11-25)
 * - Javadoc 전면 정리: 역할/계약 중심으로 간결화, 문장형/마침표/태그 통일.
 * - 엔드포인트 설명 및 응답/예외 처리 규약 명시 강화.
 * - 팝업 설정 API(updateSettings) 주석을 정식 Javadoc으로 승격.
 */

/**
 * 가맹점 재료(StoreMaterial) REST 컨트롤러.
 *
 * <p>역할</p>
 * <ul>
 *   <li>가맹점 자체 재료 생성</li>
 *   <li>가맹점 재료 목록 조회</li>
 *   <li>본사 재료 일괄 동기화(매핑)</li>
 *   <li>가맹점 재고 초기 세팅(StoreInventory 누락분 0 생성)</li>
 *   <li>가맹점 재료의 적정재고/상태 갱신</li>
 * </ul>
 *
 * <p>보안/컨텍스트</p>
 * <ul>
 *   <li>인증 컨텍스트의 {@link AppUser}에서 storeId를 취득해 매장 소유를 강제한다.</li>
 *   <li>서비스 계층에서도 매장-대상 엔티티 소유 검증을 재차 수행한다.</li>
 * </ul>
 *
 * <p>응답 규약</p>
 * <ul>
 *   <li>정상 처리 시 200 OK.</li>
 *   <li>대상 미존재/권한 불일치/검증 실패 등은 서비스 계층에서 예외를 던지고, 글로벌 예외 핸들러에서 HTTP 오류로 변환한다.</li>
 * </ul>
 *
 * <p>주의</p>
 * <ul>
 *   <li>배치/단가/유통기한 등은 본 컨트롤러의 책임이 아니다(별도 서비스에 위임).</li>
 * </ul>
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/API/store/material")
public class StoreMaterialRestController {

    private final StoreMaterialService storeMaterialService;

    /**
     * 가맹점 재료 등록.
     *
     * <p>POST /API/store/material</p>
     *
     * <p>요약</p>
     * <ul>
     *   <li>요청 본문으로 재료 정보를 받고, 인증 사용자로부터 storeId를 주입한다.</li>
     *   <li>가맹점 재료 코드는 서버가 생성한다.</li>
     *   <li>본사 재료 일괄 매핑은 별도의 동기화 API를 사용한다.</li>
     * </ul>
     *
     * <pre>
     * 요청 예시:
     * {
     *   "storeId": 3,                // 무시됨(서버가 인증 사용자 storeId로 대체)
     *   "hqMaterial": true,
     *   "materialId": 23,
     *   "code": null,
     *   "name": "양파",
     *   "category": "VEGETABLE",
     *   "baseUnit": "g",
     *   "salesUnit": "kg",
     *   "conversionRate": 1000,
     *   "optimalQuantity": 5000,
     *   "purchasePrice": 3200,
     *   "supplier": "신선마트",
     *   "temperature": "REFRIGERATE",
     *   "status": "USE"
     * }
     * </pre>
     *
     * @param dto  가맹점 재료 생성 요청.
     * @param user 인증 사용자(매장 ID 보유).
     * @return 생성된 StoreMaterial ID.
     */
    @PostMapping
    public ResponseEntity<Long> createStoreMaterial(
            @Valid @RequestBody StoreMaterialCreateDTO dto,
            @AuthenticationPrincipal AppUser user
    ) {
        dto.setStoreId(user.getStoreId());
        Long id = storeMaterialService.create(dto);
        return ResponseEntity.ok(id);
    }

    /**
     * 가맹점 재료 목록 조회.
     *
     * <p>GET /API/store/material/list</p>
     *
     * @param user 인증 사용자(매장 ID 보유).
     * @return {@link StoreMaterialResponse} 리스트.
     */
    @GetMapping("/list")
    public List<StoreMaterialResponse> list(@AuthenticationPrincipal AppUser user) {
        return storeMaterialService.getStoreMaterials(user.getStoreId());
    }

    /**
     * 선택 매장에 본사 재료 일괄 매핑.
     *
     * <p>POST /API/store/material/sync-hq</p>
     *
     * <p>요약</p>
     * <ul>
     *   <li>본사 Material 중 사용 상태(USE)인 항목을 가맹점에 StoreMaterial로 생성한다(미매핑 항목만).</li>
     *   <li>각 항목에 대해 StoreInventory도 0으로 자동 생성한다.</li>
     * </ul>
     *
     * @param user 인증 사용자(매장 ID 보유).
     * @return 새로 생성된 StoreMaterial 개수.
     */
    @PostMapping("/sync-hq")
    public int syncHqMaterials(@AuthenticationPrincipal AppUser user) {
        return storeMaterialService.mapAllHqMaterialsToStore(user.getStoreId());
    }

    /**
     * 가맹점 재고 초기 세팅(누락 StoreInventory 0 생성).
     *
     * <p>POST /API/store/material/init-inventory</p>
     *
     * @param user 인증 사용자(매장 ID 보유).
     * @return 생성된 StoreInventory 개수.
     */
    @PostMapping("/init-inventory")
    public ResponseEntity<Integer> initInventory(@AuthenticationPrincipal AppUser user) {
        int created = storeMaterialService.initStoreInventoryForStore(user.getStoreId());
        return ResponseEntity.ok(created);
    }

    /**
     * 가맹점 재료 적정재고(최소 재고) 업데이트.
     *
     * <p>PATCH /API/store/material/{id}/optimal-quantity</p>
     *
     * <p>계약</p>
     * <ul>
     *   <li>적정재고는 0 이상이며, null 허용(미지정).</li>
     *   <li>실제 재고 상태 계산은 Inventory 측 로직에 위임될 수 있다.</li>
     * </ul>
     *
     * @param storeMaterialId 대상 가맹점 재료 PK.
     * @param request         적정재고 업데이트 요청.
     * @param user            인증 사용자(매장 ID 보유).
     * @return 본문 없는 200 OK.
     */
    @PatchMapping("/{id}/optimal-quantity")
    public ResponseEntity<Void> updateOptimalQuantity(@PathVariable("id") Long storeMaterialId,
                                                      @Valid @RequestBody StoreMaterialUpdateOptimalRequest request,
                                                      @AuthenticationPrincipal AppUser user) {
        storeMaterialService.updateOptimalQuantity(user.getStoreId(), storeMaterialId, request.getOptimalQuantity());
        return ResponseEntity.ok().build();
    }

    /**
     * 가맹점 재료 상태(사용/중지) 업데이트.
     *
     * <p>PATCH /API/store/material/{id}/status</p>
     *
     * @param storeMaterialId 대상 가맹점 재료 PK.
     * @param request         상태 업데이트 요청(USE | STOP).
     * @param user            인증 사용자(매장 ID 보유).
     * @return 본문 없는 200 OK.
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable("id") Long storeMaterialId,
                                             @Valid @RequestBody StoreMaterialUpdateStatusRequest request,
                                             @AuthenticationPrincipal AppUser user) {
        storeMaterialService.updateStatus(user.getStoreId(), storeMaterialId, request.getStatus());
        return ResponseEntity.ok().build();
    }

    /**
     * 상세 설정 저장(팝업): 적정재고 및 사용여부 동시 수정.
     *
     * <p>PATCH /API/store/material/{id}/settings</p>
     *
     * <p>계약</p>
     * <ul>
     *   <li>StoreMaterial.optimalQuantity, status를 갱신한다.</li>
     *   <li>서비스 내에서 StoreInventory.optimalQuantity 동기화 및 상태 재계산을 수행한다.</li>
     * </ul>
     *
     * @param user            인증 사용자(매장 ID 보유).
     * @param storeMaterialId 대상 가맹점 재료 PK.
     * @param req             설정 변경 요청 DTO.
     * @return 변경 결과 요약 응답 DTO.
     */
    @PatchMapping("/{id}/settings")
    public ResponseEntity<StoreMaterialSettingsResponseDTO> updateSettings(@AuthenticationPrincipal AppUser user,
                                                                           @PathVariable("id") Long storeMaterialId,
                                                                           @RequestBody @Valid StoreMaterialSettingsUpdateRequestDTO req) {
        var res = storeMaterialService.updateSettings(
                user.getStoreId(),
                storeMaterialId,
                req.getOptimalQuantity(),
                req.getStatus()
        );
        return ResponseEntity.ok(res);
    }
}
