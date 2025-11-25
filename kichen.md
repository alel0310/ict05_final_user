## File: src/main/java/com/boot/ict05_final_user/domain/order/controller/CustomerOrderController.java

### Methods:
- public class CustomerOrderController 
- public ResponseEntity<CreateOrderResponseDTO> create(
- public ResponseEntity<Page<CustomerOrderListDTO>> listForStore(
- public ResponseEntity<Void> updateStatus(
- public ResponseEntity<CustomerOrderDetailDTO> getOrderDetail(

```java
package com.boot.ict05_final_user.domain.order.controller;

import com.boot.ict05_final_user.config.security.principal.AppUser;
import com.boot.ict05_final_user.domain.order.dto.*;
import com.boot.ict05_final_user.domain.order.service.CustomerOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * 가맹점 주문(Customer Orders) API 컨트롤러.
 *
 * <p>
 * - 주문 생성<br>
 * - 가맹점 기준 주문 목록 조회(검색/필터/페이징)<br>
 * - 주문 상태 변경<br>
 * - 주문 상세 조회
 * </p>
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/customer-orders")
@SecurityRequirement(name = "bearerAuth")
public class CustomerOrderController {

    private final CustomerOrderService orderService;

    /**
     * 주문을 생성합니다.
     *
     * @param user    인증 사용자
     * @param req     주문 생성 요청 DTO
     * @param request 원시 HTTP 요청(Authorization 등 헤더 확인용)
     * @return 생성된 주문 응답 DTO
     */
    @Operation(
            summary = "주문 생성",
            description = "요청 본문을 바탕으로 주문을 생성합니다. 인증 정보의 가맹점 ID를 사용합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "생성 성공",
                    content = @Content(schema = @Schema(implementation = CreateOrderResponseDTO.class), mediaType = "application/json")),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "인가 실패"),
            @ApiResponse(responseCode = "400", description = "요청 형식 오류")
    })
    @PostMapping
    public ResponseEntity<CreateOrderResponseDTO> create(
            @Parameter(hidden = true)
            @AuthenticationPrincipal AppUser user,
            @RequestBody(
                    description = "주문 생성 요청 바디",
                    required = true,
                    content = @Content(schema = @Schema(implementation = CreateOrderRequestDTO.class))
            )
            @org.springframework.web.bind.annotation.RequestBody
            CreateOrderRequestDTO req,
            HttpServletRequest request
    ) {
        String authHeader = request.getHeader("Authorization");
        log.info("Authorization header = {}", authHeader); // 토큰 확인용

        if (user == null) {
            log.warn("Unauthenticated POST /api/customer-orders 요청");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Long storeId = user.getStoreId();
        log.info("create order by storeId={}", storeId);

        return ResponseEntity.ok(orderService.create(req, storeId));
    }

    /**
     * 가맹점 기준 주문 목록을 조회합니다.
     *
     * <p>검색/필터는 쿼리 파라미터로 전달되며, 페이징/정렬 정보를 지원합니다.</p>
     *
     * @param user        인증 사용자
     * @param keyword     검색어
     * @param status      주문 상태
     * @param paymentType 결제 수단
     * @param orderType   주문 유형
     * @param period      조회 기간 프리셋
     * @param pageable    페이징/정렬 정보
     * @return 주문 목록 페이지
     */
    @Operation(
            summary = "가맹점 주문 목록 조회",
            description = "로그인한 가맹점(storeId) 기준으로 주문 목록을 조회합니다. 검색/필터/페이징을 지원합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(
                            array = @ArraySchema(schema = @Schema(implementation = CustomerOrderListDTO.class)),
                            mediaType = "application/json"
                    )),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "인가 실패")
    })
    @GetMapping
    public ResponseEntity<Page<CustomerOrderListDTO>> listForStore(
            @Parameter(hidden = true)
            @AuthenticationPrincipal AppUser user,
            @Parameter(description = "검색어")
            @RequestParam(required = false) String keyword,
            @Parameter(description = "주문 상태")
            @RequestParam(required = false) String status,
            @Parameter(description = "결제 수단")
            @RequestParam(required = false) String paymentType,
            @Parameter(description = "주문 유형")
            @RequestParam(required = false) String orderType,
            @Parameter(description = "조회 기간 프리셋")
            @RequestParam(required = false, defaultValue = "all") String period,
            @PageableDefault(page = 0, size = 20, sort = "id", direction = Sort.Direction.DESC)
            @ParameterObject Pageable pageable
    ) {
        if (user == null || user.getStoreId() == null) {
            log.warn("Forbidden: user is null or storeId is null");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        final Long storeId = user.getStoreId();
        log.info("list orders for storeId={}", storeId);

        CustomerOrderSearchDTO search = new CustomerOrderSearchDTO();
        search.setKeyword(keyword);
        search.setStatus(status);
        search.setPaymentType(paymentType);
        search.setOrderType(orderType);
        search.setPeriod(period);

        Page<CustomerOrderListDTO> pageResult =
                orderService.searchOrderListPage(storeId, search, pageable);

        log.info("orders api result size={}, totalElements={}",
                pageResult.getNumberOfElements(), pageResult.getTotalElements());

        return ResponseEntity.ok(pageResult);
    }

    /**
     * 주문 상태를 변경합니다.
     *
     * @param orderId 주문 ID
     * @param body    상태 변경 요청 DTO
     * @return 본문 없는 204 응답
     */
    @Operation(
            summary = "주문 상태 변경",
            description = "주문 ID와 요청 본문(status)을 받아 주문 상태를 변경합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "변경 성공"),
            @ApiResponse(responseCode = "400", description = "요청 형식 오류"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "인가 실패"),
            @ApiResponse(responseCode = "404", description = "주문을 찾을 수 없음")
    })
    @PatchMapping("/{orderId}/status")
    public ResponseEntity<Void> updateStatus(
            @Parameter(description = "주문 ID", required = true)
            @PathVariable Long orderId,
            @RequestBody(
                    description = "주문 상태 변경 요청 바디",
                    required = true,
                    content = @Content(schema = @Schema(implementation = UpdateStatusRequestDTO.class))
            )
            @org.springframework.web.bind.annotation.RequestBody
            UpdateStatusRequestDTO body
    ) {
        orderService.updateStatus(orderId, body.getStatus());
        return ResponseEntity.noContent().build();
    }

    /**
     * 주문 상세를 조회합니다(가맹점 기준 접근 제어).
     *
     * @param user    인증 사용자
     * @param orderId 주문 ID
     * @return 주문 상세 DTO
     */
    @Operation(
            summary = "주문 상세 조회",
            description = "로그인한 가맹점(storeId) 기준으로 단일 주문 상세를 조회합니다. 소유 매장이 아닌 경우 403을 반환합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = CustomerOrderDetailDTO.class), mediaType = "application/json")),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "인가 실패(다른 매장 주문 접근)"),
            @ApiResponse(responseCode = "404", description = "주문을 찾을 수 없음")
    })
    @GetMapping("/{orderId}")
    public ResponseEntity<CustomerOrderDetailDTO> getOrderDetail(
            @Parameter(hidden = true)
            @AuthenticationPrincipal AppUser user,
            @Parameter(description = "주문 ID", required = true)
            @PathVariable Long orderId
    ) {
        if (user == null) {
            log.warn("Unauthenticated GET /api/customer-orders/{} 요청", orderId);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Long storeId = user.getStoreId();
        log.info("get order detail orderId={}, storeId={}", orderId, storeId);

        try {
            CustomerOrderDetailDTO dto = orderService.getOrderDetail(storeId, orderId);
            return ResponseEntity.ok(dto);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

}
```

## File: src/main/java/com/boot/ict05_final_user/domain/order/service/CustomerOrderService.java

### Methods:
- public class CustomerOrderService 
- public CreateOrderResponseDTO create(CreateOrderRequestDTO req, Long storeId) 
- public void updateStatus(Long orderId, String statusText) 
- public CustomerOrderDetailDTO getOrderDetail(Long storeId, Long orderId) 
- public Page<CustomerOrderListDTO> searchOrderListPage(

```java
package com.boot.ict05_final_user.domain.order.service;

import com.boot.ict05_final_user.domain.menu.entity.Menu;
import com.boot.ict05_final_user.domain.menu.repository.MenuRepository;
import com.boot.ict05_final_user.domain.order.dto.*;
import com.boot.ict05_final_user.domain.order.entity.CustomerOrder;
import com.boot.ict05_final_user.domain.order.entity.CustomerOrderDetail;
import com.boot.ict05_final_user.domain.order.entity.OrderStatus;
import com.boot.ict05_final_user.domain.order.entity.OrderType;
import com.boot.ict05_final_user.domain.order.entity.PaymentType;
import com.boot.ict05_final_user.domain.order.repository.CustomerOrderDetailRepository;
import com.boot.ict05_final_user.domain.order.repository.CustomerOrderRepository;
import com.boot.ict05_final_user.domain.store.entity.Store;
import com.boot.ict05_final_user.domain.store.repository.StoreRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 주문 도메인의 핵심 비즈니스 로직을 제공하는 서비스.
 *
 * <p>
 * - 주문 생성<br>
 * - 주문 상태 변경<br>
 * - 주문 상세 조회(가맹점 기준 권한 확인)<br>
 * - 주문 목록 페이지 변환
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerOrderService {

    private final CustomerOrderRepository orderRepository;
    private final CustomerOrderDetailRepository detailRepository;
    private final StoreRepository storeRepository;
    private final MenuRepository menuRepository;

    /**
     * 주문을 생성합니다.
     *
     * <p>인증된 가맹점 ID를 기준으로 주문을 저장하고, 품목 상세를 함께 영속화합니다.</p>
     *
     * @param req     주문 생성 요청 DTO
     * @param storeId 인증된 가맹점 ID
     * @return 생성된 주문의 식별자/코드를 담은 응답 DTO
     * @throws IllegalArgumentException 가맹점 또는 메뉴가 존재하지 않을 때
     */
    @Transactional
    public CreateOrderResponseDTO create(CreateOrderRequestDTO req, Long storeId) {

        log.info("▶ create order storeId(from login user) = {}", storeId);

        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new IllegalArgumentException("Store not found: " + storeId));

        String orderCode = generateOrderCode();

        CustomerOrder order = CustomerOrder.builder()
                .store(store)
                .orderCode(orderCode)
                .orderType(OrderType.from(req.getOrderType()))
                .paymentType(resolvePaymentType(req.getPaymentType()))
                .totalPrice(req.getTotalPrice())
                .discount(req.getDiscount())
                .status(OrderStatus.PREPARING)
                .memo(req.getCustomerName())
                .build();

        order = orderRepository.save(order);

        for (CreateOrderRequestDTO.OrderItemRequest i : req.getItems()) {
            Menu menu = menuRepository.findById(i.getMenuId())
                    .orElseThrow(() -> new IllegalArgumentException("Menu not found: " + i.getMenuId()));

            CustomerOrderDetail d = CustomerOrderDetail.builder()
                    .order(order)
                    .menuIdFk(menu)
                    .quantity(i.getQuantity())
                    .unitPrice(i.getUnitPrice())
                    .build();
            detailRepository.save(d);
        }

        return CreateOrderResponseDTO.builder()
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .build();
    }

    /**
     * 주문 상태를 변경합니다.
     *
     * <p>영문 상수 또는 DB 라벨 문자열을 입력받아 {@link OrderStatus}로 변환 후 반영합니다.</p>
     *
     * @param orderId    주문 ID
     * @param statusText 상태 문자열
     * @throws IllegalArgumentException 주문이 없거나 상태 문자열이 유효하지 않을 때
     */
    @Transactional
    public void updateStatus(Long orderId, String statusText) {
        CustomerOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        OrderStatus newStatus;
        try {
            newStatus = OrderStatus.valueOf(statusText.toUpperCase());
        } catch (Exception ignore) {
            newStatus = OrderStatus.from(statusText);
        }
        order.setStatus(newStatus);
    }

    /**
     * 주문 상세를 조회합니다(가맹점 기준 접근 제어).
     *
     * @param storeId 로그인 가맹점 ID
     * @param orderId 주문 ID
     * @return 주문 상세 DTO
     * @throws IllegalArgumentException 주문이 존재하지 않을 때
     * @throws IllegalStateException    다른 가맹점의 주문일 때
     */
    public CustomerOrderDetailDTO getOrderDetail(Long storeId, Long orderId) {
        CustomerOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        if (!order.getStore().getId().equals(storeId)) {
            throw new IllegalStateException("다른 매장의 주문에 접근할 수 없습니다.");
        }

        List<CustomerOrderDetail> details = detailRepository.findByOrder_Id(orderId);

        return CustomerOrderDetailDTO.from(order, details);
    }

    /**
     * 주문 목록을 페이지 단위로 조회하고 목록용 DTO로 변환합니다.
     *
     * @param storeId  가맹점 ID
     * @param cond     검색/필터 조건
     * @param pageable 페이징/정렬 정보
     * @return 주문 목록 페이지 DTO
     */
    public Page<CustomerOrderListDTO> searchOrderListPage(
            Long storeId,
            CustomerOrderSearchDTO cond,
            Pageable pageable
    ) {
        var page = orderRepository.searchOrders(storeId, cond, pageable);
        return page.map(CustomerOrderListDTO::from);
    }

    /**
     * 주문 코드를 생성합니다.
     *
     * <p>최근 주문 ID를 기반으로 증가값을 생성하여 코드로 만듭니다.</p>
     *
     * @return 생성된 주문 코드
     */
    private String generateOrderCode() {
        Long lastId = orderRepository.findTopByOrderByIdDesc()
                .map(CustomerOrder::getId)
                .orElse(0L);

        long next = lastId + 1;
        return String.format("#%04d", next);
    }

    /**
     * 결제수단 입력 문자열을 {@link PaymentType}으로 변환합니다.
     *
     * <p>영문 상수/코드 또는 라벨 문자열을 허용합니다.</p>
     *
     * @param value 입력 문자열
     * @return 매핑된 결제수단
     * @throws IllegalArgumentException 매핑 실패 시
     */
    private PaymentType resolvePaymentType(String value) {
        if (value == null) {
            throw new IllegalArgumentException("paymentType is null");
        }

        String v = value.trim();

        if (v.endsWith("결제")) {
            v = v.substring(0, v.length() - 2);
        }

        try {
            return PaymentType.valueOf(v.toUpperCase());
        } catch (Exception ignore) { }

        for (PaymentType type : PaymentType.values()) {
            if (type.getLabel().equals(v)) {
                return type;
            }
        }

        throw new IllegalArgumentException("Unknown paymentType: " + value);
    }

    /** null 안전 소문자 변환 유틸. */
    private String safeLower(String s) {
        return s == null ? null : s.toLowerCase();
    }
}
```

## File: src/main/java/com/boot/ict05_final_user/domain/order/service/OrderStatusService.java

### Methods:
- public class OrderStatusService 
- public void updateStatus(Long orderId, OrderStatus next) 

```java
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

/**
 * 주문 상태 전이와 그에 따른 재고 차감/사용 로그 기록을 담당하는 서비스.
 *
 * <p><b>전이 규칙</b></p>
 * <ul>
 *   <li>{@link OrderStatus#PREPARING} → {@link OrderStatus#COOKING} 전이 시 재고 차감 수행</li>
 *   <li>그 외 전이는 상태만 갱신</li>
 * </ul>
 *
 * <p><b>재고 차감 흐름</b></p>
 * <ol>
 *   <li>레시피 기반 필요 수량 집계({@link MenuUsageCalculator})</li>
 *   <li>소비 요청 DTO 변환 후 판매 소진 처리({@link StoreConsumptionService})</li>
 *   <li>사용 로그 기록({@link MenuUsageMaterialLogService})</li>
 * </ol>
 */
@Service
@RequiredArgsConstructor
public class OrderStatusService {

    private final CustomerOrderRepository orderRepo;                 // 주문 저장소
    private final MenuUsageCalculator usageCalculator;               // 레시피 기반 필요 수량 계산기
    private final StoreConsumptionService storeConsumptionService;   // 재고 차감(판매 소진)
    private final StoreMaterialRepository storeMaterialRepository;   // materialId -> storeMaterialId 매핑
    private final MenuUsageMaterialLogService usageLogService;       // 사용 로그 기록

    /**
     * 주문 상태를 갱신한다. 필요 시 재고 차감을 수행한다.
     *
     * <p>규칙: {@code PREPARING → COOKING} 전이에서만 재고 차감/로그 기록을 트리거한다.</p>
     *
     * @param orderId 주문 ID
     * @param next    다음 상태
     * @throws IllegalArgumentException 주문이 존재하지 않을 때
     */
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

    /**
     * 레시피에 따른 필요 수량을 집계하고, 판매 소진 처리 및 사용 로그를 기록한다.
     *
     * <p>처리 순서:</p>
     * <ol>
     *   <li>필요 수량 집계: materialId → 총 필요 수량</li>
     *   <li>상관키 생성</li>
     *   <li>소비 서비스 호출</li>
     *   <li>사용 로그 기록</li>
     * </ol>
     *
     * @param order 대상 주문
     */
    private void applyUsage(CustomerOrder order) {
        // 1) 주문 전체 필요 재료 합계 (materialId -> 총필요수량)
        Map<Long, BigDecimal> need = usageCalculator.calcMaterialsForOrder(order);

        // 2) 상관키 (멱등/추적용)
        String corr = "ORDER-" + order.getId();

        // 3) StoreConsumptionService 가 요구하는 DTO로 변환해서 호출
        Long storeId = order.getStore().getId();
        StoreConsumeRequestDTO req = toConsumeRequest(storeId, need, corr);
        storeConsumptionService.consume(storeId, req);

        // 4) 사용 로그 기록
        usageLogService.logDeduct(order, need, corr);
    }

    /**
     * 필요 수량 맵(materialId → qty)을 재고 소비 서비스가 요구하는
     * DTO(storeMaterialId → qty 라인 리스트)로 변환한다.
     *
     * @param storeId        매장 ID
     * @param need           재료별 필요 수량 맵
     * @param correlationId  상관키
     * @return 판매 소진 요청 DTO
     * @throws IllegalArgumentException 매장-재료 매핑이 없을 때
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

            // storeId + materialId -> storeMaterialId 조회
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
```

## File: src/main/java/com/boot/ict05_final_user/domain/order/repository/CustomerOrderDetailRepository.java

### Methods:
- public interface CustomerOrderDetailRepository
- List<CustomerOrderDetail> findByOrder_Id(Long orderId)

```java
package com.boot.ict05_final_user.domain.order.repository;

import com.boot.ict05_final_user.domain.order.entity.CustomerOrderDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerOrderDetailRepository
        extends JpaRepository<CustomerOrderDetail, Long> {

    List<CustomerOrderDetail> findByOrder_Id(Long orderId);
}
```

## File: src/main/java/com/boot/ict05_final_user/domain/order/repository/CustomerOrderRepositoryCustom.java

### Methods:
- Page<CustomerOrder> searchOrders(Long storeId,

```java
package com.boot.ict05_final_user.domain.order.repository;

import com.boot.ict05_final_user.domain.order.dto.CustomerOrderSearchDTO;
import com.boot.ict05_final_user.domain.order.entity.CustomerOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CustomerOrderRepositoryCustom {

    // 로그인한 가맹점 기준 주문 검색 + 페이징
    Page<CustomerOrder> searchOrders(Long storeId,
                                     CustomerOrderSearchDTO cond,
                                     Pageable pageable);
}
```

## File: src/main/java/com/boot/ict05_final_user/domain/order/repository/CustomerOrderRepositoryImpl.java

### Methods:
- public class CustomerOrderRepositoryImpl implements CustomerOrderRepositoryCustom 
- public Page<CustomerOrder> searchOrders(Long storeId, CustomerOrderSearchDTO cond, Pageable pageable) 

```java
package com.boot.ict05_final_user.domain.order.repository;

import com.boot.ict05_final_user.domain.order.dto.CustomerOrderSearchDTO;
import com.boot.ict05_final_user.domain.order.entity.CustomerOrder;
import com.boot.ict05_final_user.domain.order.entity.QCustomerOrder;
import com.boot.ict05_final_user.domain.order.entity.QCustomerOrderDetail;
import com.boot.ict05_final_user.domain.menu.entity.QMenu;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * {@link CustomerOrderRepositoryCustom} 구현체.
 *
 * <p>QueryDSL을 사용하여 가맹점 기준 주문 목록을 검색/필터/정렬/페이징 처리합니다.</p>
 *
 * <ul>
 *   <li>가맹점 필터(storeId) 강제</li>
 *   <li>기간 프리셋(today/week/month/all) 필터</li>
 *   <li>상태/결제수단/주문유형 필터</li>
 *   <li>키워드: 주문코드/메모/전화번호 또는 주문 상세의 메뉴명 검색</li>
 *   <li>정렬: 기본 id DESC, 요청 Sort 반영</li>
 * </ul>
 */
@Repository
@RequiredArgsConstructor
public class CustomerOrderRepositoryImpl implements CustomerOrderRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    /**
     * 가맹점(storeId) 기준으로 주문을 검색합니다.
     *
     * <p>검색 조건이 null이면 기본값으로 처리하며, 기간/상태/결제수단/유형/키워드 필터를 조합합니다.
     * 키워드 검색 시 주문코드/메모/전화번호 또는 주문 상세의 메뉴명을 대상으로 OR 검색합니다.</p>
     *
     * @param storeId  가맹점 ID(필수)
     * @param cond     검색/필터 조건 DTO(Null 허용)
     * @param pageable 페이징/정렬 정보
     * @return 주문 페이지 결과
     * @throws IllegalArgumentException storeId가 null인 경우
     */
    @Override
    public Page<CustomerOrder> searchOrders(Long storeId, CustomerOrderSearchDTO cond, Pageable pageable) {
        if (storeId == null) throw new IllegalArgumentException("storeId is required");

        QCustomerOrder order = QCustomerOrder.customerOrder;
        QCustomerOrderDetail detail = QCustomerOrderDetail.customerOrderDetail;
        QMenu menu = QMenu.menu;

        if (cond == null) cond = new CustomerOrderSearchDTO();

        BooleanBuilder where = new BooleanBuilder();
        where.and(order.store.id.eq(storeId));

        BooleanExpression periodExpr = buildPeriodExpr(order, cond.getPeriod());
        if (periodExpr != null) where.and(periodExpr);

        if (StringUtils.hasText(cond.getStatus()) && !"all".equalsIgnoreCase(cond.getStatus())) {
            where.and(order.status.stringValue().eq(cond.getStatus().toUpperCase()));
        }
        if (StringUtils.hasText(cond.getPaymentType()) && !"all".equalsIgnoreCase(cond.getPaymentType())) {
            where.and(order.paymentType.stringValue().eq(cond.getPaymentType().toUpperCase()));
        }
        if (StringUtils.hasText(cond.getOrderType()) && !"all".equalsIgnoreCase(cond.getOrderType())) {
            where.and(order.orderType.stringValue().eq(cond.getOrderType().toUpperCase()));
        }

        if (StringUtils.hasText(cond.getKeyword())) {
            String kw = cond.getKeyword().trim();
            BooleanExpression inOrder =
                    order.orderCode.containsIgnoreCase(kw)
                            .or(order.memo.containsIgnoreCase(kw))
                            .or(order.customerPhone.containsIgnoreCase(kw));
            BooleanExpression inMenu = menu.menuName.containsIgnoreCase(kw);

            where.and(
                    inOrder.or(
                            order.id.in(
                                    queryFactory.select(detail.order.id)
                                            .from(detail)
                                            .leftJoin(detail.menuIdFk, menu)
                                            .where(inMenu)
                            )
                    )
            );
        }

        Sort sort = pageable.getSort().isUnsorted()
                ? Sort.by(Sort.Direction.DESC, "id")
                : pageable.getSort();

        List<CustomerOrder> content = queryFactory
                .selectFrom(order)
                .where(where)
                .orderBy(sort.getOrderFor("id").isAscending() ? order.id.asc() : order.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        Long total = queryFactory
                .select(order.id.count())
                .from(order)
                .where(where)
                .fetchOne();

        return new PageImpl<>(content, pageable, total != null ? total : 0L);
    }

    /**
     * 기간 프리셋(today/week/month/all)에 따른 주문일시 필터식을 생성합니다.
     *
     * <p>종료 시각은 익일 00:00으로 설정하여 당일 포함 범위를 닫힌 구간처럼 처리합니다.</p>
     *
     * @param order  QCustomerOrder
     * @param period 기간 프리셋 문자열
     * @return 기간 필터 식 또는 null(all/비어있음)
     */
    private BooleanExpression buildPeriodExpr(QCustomerOrder order, String period) {
        LocalDate today = LocalDate.now();

        if (!StringUtils.hasText(period) || "all".equalsIgnoreCase(period)) {
            return null;
        }

        LocalDateTime start;
        LocalDateTime end = today.plusDays(1).atStartOfDay();

        switch (period) {
            case "today" -> start = today.atStartOfDay();
            case "week"  -> start = today.minusDays(6).atStartOfDay();
            case "month" -> start = today.withDayOfMonth(1).atStartOfDay();
            default -> { return null; }
        }

        return order.orderedAt.between(start, end);
        // between은 시작/끝 모두 포함(스펙상)이나, end를 익일 00:00으로 설정해 당일 범위를 자연스럽게 커버
    }
}
```

## File: src/main/java/com/boot/ict05_final_user/domain/order/repository/CustomerOrderRepository.java

### Methods:
- List<CustomerOrder> findByStore_IdAndStatusInOrderByOrderedAtAsc(
- List<OrderStatus> statuses

```java
package com.boot.ict05_final_user.domain.order.repository;

import com.boot.ict05_final_user.domain.order.entity.CustomerOrder;
import com.boot.ict05_final_user.domain.order.entity.OrderStatus;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long>, CustomerOrderRepositoryCustom  {

    // 최신 주문 하나
    Optional<CustomerOrder> findTopByOrderByIdDesc();

    // 주방에서 사용할 주문 목록 조회 (가맹점 기준 + 상태 in)
    List<CustomerOrder> findByStore_IdAndStatusInOrderByOrderedAtAsc(
            Long storeId,
            List<OrderStatus> statuses
    );

    // 주문 + 매장 + 디테일 + 디테일의 메뉴를 한 번에 로딩
    @EntityGraph(attributePaths = {"store", "details", "details.menuIdFk"})
    Optional<CustomerOrder> findById(Long id);
}

```

## File: src/main/java/com/boot/ict05_final_user/domain/order/dto/UpdateStatusRequestDTO.java
```java
package com.boot.ict05_final_user.domain.order.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

/**
 * 주문 상태 변경 요청 DTO.
 *
 * <p>주문 ID 경로변수와 함께 사용되어 주문 상태를 변경합니다.</p>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "주문 상태 변경 요청 DTO")
public class UpdateStatusRequestDTO {

    /**
     * 변경할 주문 상태.
     *
     * <p>지원 값: PREPARING, COOKING, READY, COMPLETED, CANCELLED/CANCELED, PAID 등</p>
     */
    @Schema(
            description = "변경할 주문 상태",
            allowableValues = {
                    "PREPARING", "COOKING", "READY", "COMPLETED", "CANCELLED", "CANCELED", "PAID"
            },
            nullable = false
    )
    private String status;
}
```

## File: src/main/java/com/boot/ict05_final_user/domain/order/dto/CustomerOrderDetailDTO.java
```java
package com.boot.ict05_final_user.domain.order.dto;

import com.boot.ict05_final_user.domain.order.entity.CustomerOrder;
import com.boot.ict05_final_user.domain.order.entity.CustomerOrderDetail;
import com.boot.ict05_final_user.domain.order.entity.OrderStatus;
import com.boot.ict05_final_user.domain.order.entity.OrderType;
import com.boot.ict05_final_user.domain.order.entity.PaymentType;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 주문 상세 응답 DTO.
 *
 * <p>주문 기본정보, 결제/상태, 품목 목록 및 금액 정보를 포함합니다.</p>
 */
@Data
@Schema(description = "주문 상세 응답 DTO")
public class CustomerOrderDetailDTO {

    @Schema(description = "주문 ID", accessMode = Schema.AccessMode.READ_ONLY)
    private Long orderId;

    @Schema(description = "주문 코드", accessMode = Schema.AccessMode.READ_ONLY)
    private String orderCode;

    @Schema(description = "주문(접수) 시각", accessMode = Schema.AccessMode.READ_ONLY)
    private LocalDateTime orderedAt;

    @Schema(description = "고객 이름/표시명")
    private String customerName;

    @Schema(description = "고객 연락처")
    private String customerPhone;

    @Schema(description = "주문 상태", implementation = OrderStatus.class)
    private OrderStatus status;

    @Schema(description = "주문 유형", implementation = OrderType.class)
    private OrderType orderType;

    @Schema(description = "결제 수단", implementation = PaymentType.class)
    private PaymentType paymentType;

    @Schema(description = "결제 총액")
    private int totalPrice;

    @Schema(description = "할인 금액")
    private int discount;

    @Schema(description = "할인 전 금액(총액+할인)")
    private int originalTotal;

    @ArraySchema(arraySchema = @Schema(description = "주문 품목 목록"),
            schema = @Schema(implementation = ItemDTO.class))
    private List<ItemDTO> items;

    /**
     * 주문 상세 품목 DTO.
     *
     * <p>메뉴 ID/이름, 단가, 수량, 라인 합계를 포함합니다.</p>
     */
    @Data
    @Schema(description = "주문 상세 품목 DTO")
    public static class ItemDTO {

        @Schema(description = "메뉴 ID")
        private Long menuId;

        @Schema(description = "메뉴 이름")
        private String menuName;

        @Schema(description = "단가")
        private int unitPrice;

        @Schema(description = "수량")
        private int quantity;

        @Schema(description = "라인 합계(단가×수량)")
        private int lineTotal;

        public static ItemDTO from(CustomerOrderDetail d) {
            ItemDTO dto = new ItemDTO();
            dto.setMenuId(d.getMenuIdFk().getMenuId());
            dto.setMenuName(d.getMenuIdFk().getMenuName());
            dto.setUnitPrice(d.getUnitPrice().intValue());
            dto.setQuantity(d.getQuantity());
            dto.setLineTotal(d.getUnitPrice().intValue() * d.getQuantity());
            return dto;
        }
    }

    /**
     * 엔티티에서 주문 상세 DTO로 변환합니다.
     *
     * @param order   주문 엔티티
     * @param details 주문 품목 엔티티 리스트
     * @return 변환된 DTO
     */
    public static CustomerOrderDetailDTO from(CustomerOrder order, List<CustomerOrderDetail> details) {
        CustomerOrderDetailDTO dto = new CustomerOrderDetailDTO();
        dto.setOrderId(order.getId());
        dto.setOrderCode(order.getOrderCode());
        dto.setOrderedAt(order.getOrderedAt());
        dto.setCustomerName(order.getMemo());
        dto.setCustomerPhone(order.getCustomerPhone());

        dto.setStatus(order.getStatus());
        dto.setOrderType(order.getOrderType());
        dto.setPaymentType(order.getPaymentType());

        dto.setTotalPrice(order.getTotalPrice().intValue());
        dto.setDiscount(order.getDiscount().intValue());
        dto.setOriginalTotal(order.getTotalPrice().intValue() + order.getDiscount().intValue());

        dto.setItems(details.stream()
                .map(ItemDTO::from)
                .collect(Collectors.toList()));

        return dto;
    }
}
```

## File: src/main/java/com/boot/ict05_final_user/domain/order/dto/CreateOrderRequestDTO.java
```java
package com.boot.ict05_final_user.domain.order.dto;

import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * 주문 생성 요청 DTO.
 *
 * <p>
 * 가맹점 주문 생성 시 필요한 기본 정보를 담습니다.
 * 주문 유형/결제 수단 규격, 총액/할인, 품목 목록 등을 포함합니다.
 * </p>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "주문 생성 요청 DTO")
public class CreateOrderRequestDTO {

    /** 가맹점 ID (인증 정보로 대체 가능) */
    @Schema(description = "가맹점 ID", nullable = true)
    private Long storeId;

    /** 외부/프론트 생성 가능 주문 코드 */
    @Schema(description = "주문 코드", nullable = true)
    private String orderCode;

    /** 주문 유형 (대문자 규격) */
    @Schema(description = "주문 유형", allowableValues = {"VISIT", "TAKEOUT", "DELIVERY"}, nullable = false)
    private String orderType;

    /** 결제 수단 (소문자 규격) */
    @Schema(description = "결제 수단", allowableValues = {"card", "cash", "voucher", "external"}, nullable = false)
    private String paymentType;

    /** 총 결제 금액 */
    @Schema(description = "총 결제 금액", nullable = false)
    private BigDecimal totalPrice;

    /** 할인 금액 */
    @Schema(description = "할인 금액", nullable = true)
    private BigDecimal discount;

    /** 고객 식별/표시명(메모 용도 포함) */
    @Schema(description = "고객 이름/표시명", nullable = true)
    private String customerName;

    /** 주문 품목 목록 */
    @ArraySchema(arraySchema = @Schema(description = "주문 품목 목록", nullable = false),
            schema = @Schema(implementation = OrderItemRequest.class))
    private List<OrderItemRequest> items;

    /**
     * 주문 품목 요청 DTO.
     *
     * <p>메뉴 ID, 수량, 단가로 구성됩니다.</p>
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(description = "주문 품목 요청 DTO")
    public static class OrderItemRequest {

        /** 메뉴 ID */
        @Schema(description = "메뉴 ID", nullable = false)
        private Long menuId;

        /** 주문 수량 */
        @Schema(description = "수량", nullable = false)
        private Integer quantity;

        /** 품목 단가 */
        @Schema(description = "단가", nullable = false)
        private BigDecimal unitPrice;
    }
}
```

## File: src/main/java/com/boot/ict05_final_user/domain/order/dto/CustomerOrderListDTO.java
```java
package com.boot.ict05_final_user.domain.order.dto;

import com.boot.ict05_final_user.domain.order.entity.CustomerOrder;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 주문 목록 화면에 표시되는 주문 요약 DTO.
 *
 * <p>주문 기본정보, 상태, 결제/유형, 품목 요약을 포함합니다.</p>
 */
@Getter
@Builder
@Schema(description = "주문 목록 요약 DTO")
public class CustomerOrderListDTO {

    @Schema(description = "주문 ID", accessMode = Schema.AccessMode.READ_ONLY)
    private Long id;

    @Schema(description = "주문 코드", accessMode = Schema.AccessMode.READ_ONLY)
    private String orderCode;

    @Schema(description = "주문 유형", allowableValues = {"VISIT", "TAKEOUT", "DELIVERY"})
    private String orderType;

    @Schema(description = "결제 수단", allowableValues = {"CARD", "CASH", "VOUCHER", "EXTERNAL"})
    private String paymentType;

    @Schema(description = "총 결제 금액")
    private BigDecimal totalPrice;

    @Schema(description = "주문 상태")
    private String status;

    @Schema(description = "주문(접수) 시각")
    private LocalDateTime orderDate;

    @Schema(description = "고객 이름/표시명")
    private String customerName;

    @Schema(description = "고객 연락처")
    private String customerPhone;

    @Schema(description = "배달 주소")
    private String deliveryAddress;

    @ArraySchema(arraySchema = @Schema(description = "주문 품목 목록"),
            schema = @Schema(implementation = CustomerOrderItemDTO.class))
    private List<CustomerOrderItemDTO> items;

    /**
     * 엔티티로부터 목록용 DTO를 생성합니다.
     *
     * @param order 주문 엔티티
     * @return 변환된 DTO
     */
    public static CustomerOrderListDTO from(CustomerOrder order) {

        // 주문 상세 → 메뉴 리스트 변환
        List<CustomerOrderItemDTO> items = order.getDetails().stream()
                .map(d -> CustomerOrderItemDTO.builder()
                        .menuId(d.getMenuIdFk().getMenuId())
                        .menuName(d.getMenuIdFk().getMenuName())
                        .quantity(d.getQuantity())
                        .unitPrice(d.getUnitPrice())
                        .build()
                )
                .toList();

        return CustomerOrderListDTO.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .orderType(order.getOrderType().name())
                .paymentType(order.getPaymentType().name())
                .totalPrice(order.getTotalPrice())
                .status(order.getStatus().name())
                .orderDate(order.getOrderedAt())
                .customerName(order.getMemo())
                .customerPhone(order.getCustomerPhone())
                .deliveryAddress(order.getDeliveryAddress())
                .items(items)
                .build();
    }
}
```

## File: src/main/java/com/boot/ict05_final_user/domain/order/dto/CustomerOrderSearchDTO.java
```java
package com.boot.ict05_final_user.domain.order.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 가맹점 주문 목록 조회용 검색/필터 DTO.
 *
 * <p>키워드, 상태, 결제수단, 주문유형, 기간 프리셋을 통해 목록 검색을 수행합니다.</p>
 */
@Data
@Schema(description = "주문 목록 검색/필터 DTO")
public class CustomerOrderSearchDTO {

    /** 검색어 */
    @Schema(description = "검색어(주문번호/고객명/전화번호/메뉴명 등)")
    private String keyword;

    /** 상태 */
    @Schema(
            description = "주문 상태",
            allowableValues = {"PENDING", "PREPARING", "COOKING", "READY", "COMPLETED", "CANCELLED"}
    )
    private String status;

    /** 결제 */
    @Schema(
            description = "결제 수단(영문 코드 또는 한글 라벨)",
            allowableValues = {"CARD", "CASH", "VOUCHER", "EXTERNAL"}
    )
    private String paymentType;

    /** 주문유형 */
    @Schema(
            description = "주문 유형",
            allowableValues = {"VISIT", "TAKEOUT", "DELIVERY"}
    )
    private String orderType;

    /** 기간 */
    @Schema(
            description = "조회 기간 프리셋",
            allowableValues = {"all", "today", "week", "month"}
    )
    private String period = "all";
}
```

## File: src/main/java/com/boot/ict05_final_user/domain/order/dto/CreateOrderResponseDTO.java
```java
package com.boot.ict05_final_user.domain.order.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

/**
 * 주문 생성 응답 DTO.
 *
 * <p>주문 생성 결과로 반환되는 식별자 및 코드 정보를 포함합니다.</p>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "주문 생성 응답 DTO")
public class CreateOrderResponseDTO {

    /** 주문 ID */
    @Schema(description = "주문 ID", accessMode = Schema.AccessMode.READ_ONLY)
    private Long orderId;

    /** 주문 코드 */
    @Schema(description = "주문 코드", accessMode = Schema.AccessMode.READ_ONLY)
    private String orderCode;
}
```

## File: src/main/java/com/boot/ict05_final_user/domain/order/dto/CustomerOrderItemDTO.java
```java
package com.boot.ict05_final_user.domain.order.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

/**
 * 주문 상세 내 단일 품목을 표현하는 DTO.
 *
 * <p>메뉴 식별자/이름, 수량, 단가 정보를 포함합니다.</p>
 */
@Getter
@Builder
@Schema(description = "주문 상세 품목 DTO")
public class CustomerOrderItemDTO {

    @Schema(description = "메뉴 ID", nullable = false)
    private Long menuId;

    @Schema(description = "메뉴 이름", nullable = false)
    private String menuName;

    @Schema(description = "수량", nullable = false)
    private Integer quantity;

    @Schema(description = "단가(BigDecimal)", nullable = false)
    private BigDecimal unitPrice;
}
```

## File: src/main/java/com/boot/ict05_final_user/domain/order/converter/PaymentTypeConverter.java
```java
package com.boot.ict05_final_user.domain.order.converter;

import com.boot.ict05_final_user.domain.order.entity.PaymentType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * {@link PaymentType} ↔ {@link String} 변환을 담당하는 JPA AttributeConverter.
 *
 * <p>
 * 저장 규칙:
 * <ul>
 *   <li>엔티티 → DB: Enum name(CARD, CASH, VOUCHER, EXTERNAL)을 저장</li>
 *   <li>DB → 엔티티: 우선 Enum name(대소문자 무시)으로 매핑을 시도하고,
 *       실패 시 한글 라벨(예: "카드", "현금")과 비교하여 매핑</li>
 * </ul>
 * </p>
 *
 * <p>
 * 적용 방식: {@code @Converter(autoApply = false)} 이므로,
 * 해당 필드에 {@code @Convert(converter = PaymentTypeConverter.class)} 를 명시적으로 적용합니다.
 * </p>
 *
 * <p><b>Null 처리</b></p>
 * <ul>
 *   <li>엔티티 → DB: {@code null} 입력 시 {@code null}</li>
 *   <li>DB → 엔티티: {@code null} 입력 시 {@code null}</li>
 * </ul>
 *
 * <p><b>예외</b></p>
 * <ul>
 *   <li>Enum name/한글 라벨 어느 쪽에도 매핑되지 않으면 {@link IllegalArgumentException} 발생</li>
 * </ul>
 */
@Converter(autoApply = false)
public class PaymentTypeConverter implements AttributeConverter<PaymentType, String> {

    /** 엔티티의 결제수단 Enum을 DB 저장용 문자열(Enum name)로 변환합니다. */
    @Override
    public String convertToDatabaseColumn(PaymentType attribute) {
        return attribute == null ? null : attribute.name();
    }

    /** DB의 문자열을 결제수단 Enum으로 변환합니다. (Enum name → 라벨 순으로 매핑 시도) */
    @Override
    public PaymentType convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;

        // 1) enum name 기준 (CARD / card 등)
        try {
            return PaymentType.valueOf(dbData.trim().toUpperCase());
        } catch (IllegalArgumentException ignore) {
        }

        // 2) 한글 라벨 기준 ("카드", "현금" 등)도 허용
        for (PaymentType type : PaymentType.values()) {
            if (type.getLabel().equals(dbData.trim())) {
                return type;
            }
        }

        throw new IllegalArgumentException("Unknown PaymentType: " + dbData);
    }
}
```

## File: src/main/java/com/boot/ict05_final_user/domain/order/converter/OrderTypeConverter.java
```java
package com.boot.ict05_final_user.domain.order.converter;

import com.boot.ict05_final_user.domain.order.entity.OrderType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * {@link OrderType} ↔ {@link String} 변환을 담당하는 JPA AttributeConverter.
 *
 * <p>
 * - DB 컬럼에는 Enum의 DB 표현값(예: 코드/키 문자열)을 저장하고,<br>
 * - 엔티티 필드에는 {@link OrderType} Enum을 사용합니다.
 * </p>
 *
 * <p>
 * 적용 방식: {@code @Converter(autoApply = false)} 이므로,
 * 엔티티 필드에 {@code @Convert(converter = OrderTypeConverter.class)}로 명시 적용합니다.
 * </p>
 *
 * <p><b>Null 처리</b></p>
 * <ul>
 *   <li>엔티티 → DB: {@code null} 입력 시 {@code null} 반환</li>
 *   <li>DB → 엔티티: {@code null} 입력 시 {@code null} 반환</li>
 * </ul>
 */
@Converter(autoApply = false)
public class OrderTypeConverter implements AttributeConverter<OrderType, String> {

    /**
     * 엔티티의 {@link OrderType} 값을 DB 저장용 문자열로 변환합니다.
     *
     * @param attribute 엔티티의 주문 유형 enum 값(Null 허용)
     * @return DB 저장용 문자열 또는 {@code null}
     */
    @Override
    public String convertToDatabaseColumn(OrderType attribute) {
        return attribute == null ? null : attribute.getDbValue(); // "VISIT" 등
    }

    /**
     * DB의 문자열 값을 엔티티의 {@link OrderType} enum으로 변환합니다.
     *
     * @param dbData DB 컬럼의 문자열(Null 허용)
     * @return 매핑된 enum 값 또는 {@code null}
     */
    @Override
    public OrderType convertToEntityAttribute(String dbData) {
        return dbData == null ? null : OrderType.from(dbData);
    }
}
```

## File: src/main/java/com/boot/ict05_final_user/domain/order/converter/OrderStatusConverter.java
```java
package com.boot.ict05_final_user.domain.order.converter;

import com.boot.ict05_final_user.domain.order.entity.OrderStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * {@link OrderStatus} ↔ {@link String} 변환을 담당하는 JPA AttributeConverter.
 *
 * <p>
 * - DB 컬럼: 상태의 한글 라벨(예: "준비중")을 저장<br>
 * - 엔티티: {@link OrderStatus} enum을 사용
 * </p>
 *
 * <p>
 * 적용 방식: {@code @Converter(autoApply = false)} 이므로,
 * 엔티티 필드에 {@code @Convert(converter = OrderStatusConverter.class)} 로 명시 적용합니다.
 * </p>
 *
 * <p><b>Null 처리</b></p>
 * <ul>
 *   <li>엔티티 → DB: {@code null} 입력 시 {@code null} 반환</li>
 *   <li>DB → 엔티티: {@code null} 입력 시 {@code null} 반환</li>
 * </ul>
 */
@Converter(autoApply = false)
public class OrderStatusConverter implements AttributeConverter<OrderStatus, String> {

    /**
     * 엔티티의 {@link OrderStatus} 값을 DB 저장용 문자열(한글 라벨)로 변환합니다.
     *
     * @param attribute 엔티티의 상태 enum 값(Null 허용)
     * @return DB 저장용 한글 라벨 문자열 또는 {@code null}
     */
    @Override
    public String convertToDatabaseColumn(OrderStatus attribute) {
        return attribute == null ? null : attribute.getDbValue(); // "준비중" 같은 한글
    }

    /**
     * DB의 상태 문자열(한글 라벨)을 엔티티의 {@link OrderStatus} enum으로 변환합니다.
     *
     * @param dbData DB 컬럼의 한글 라벨 문자열(Null 허용)
     * @return 매핑된 enum 값 또는 {@code null}
     */
    @Override
    public OrderStatus convertToEntityAttribute(String dbData) {
        return dbData == null ? null : OrderStatus.from(dbData);  // 한글 -> enum
    }
}
```

## File: src/main/java/com/boot/ict05_final_user/domain/order/entity/PaymentType.java
```java
package com.boot.ict05_final_user.domain.order.entity;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * 결제 수단 유형 Enum.
 *
 * <p>주문 결제 시 사용되는 결제 수단을 카드/현금/상품권/외부 결제로 구분합니다.</p>
 */
@Schema(description = "결제 수단 유형", allowableValues = {"CARD", "CASH", "VOUCHER", "EXTERNAL"})
public enum PaymentType {

    /** 카드 결제 */
    CARD("카드"),

    /** 현금 결제 */
    CASH("현금"),

    /** 상품권 결제 */
    VOUCHER("상품권"),

    /** 외부(타 PG/제휴사 등) 결제 */
    EXTERNAL("외부 결제");

    /** 화면 및 응답 DTO 등에 노출할 한글 라벨 */
    private final String label;

    PaymentType(String label) {
        this.label = label;
    }

    /** 한글 라벨(표시용)을 반환합니다. */
    @Schema(description = "표시용 한글 라벨")
    public String getLabel() {
        return label;
    }
}
```

## File: src/main/java/com/boot/ict05_final_user/domain/order/entity/OrderStatus.java
```java
package com.boot.ict05_final_user.domain.order.entity;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * 주문 상태 Enum.
 *
 * <p>DB에는 한글 라벨(예: "준비중")을 저장하며, 애플리케이션 로직에서는 영문 키(Enum 상수)를 사용합니다.</p>
 */
@Schema(
        description = "주문 상태",
        allowableValues = {
                "PENDING", "PAID", "PREPARING", "COOKING", "COMPLETED",
                "CANCELED", "READY", "REFUNDED"
        }
)
public enum OrderStatus {
    PENDING("대기"),
    PAID("결제완료"),
    PREPARING("준비중"),
    COOKING("조리중"),
    COMPLETED("완료"),
    CANCELED("취소"),
    READY("픽업대기"),
    REFUNDED("환불");

    /** DB 저장용 한글 라벨 */
    private final String dbValue;

    OrderStatus(String dbValue) { this.dbValue = dbValue; }

    /**
     * DB 저장용 한글 라벨을 반환합니다.
     *
     * @return 한글 라벨
     */
    public String getDbValue() { return dbValue; }

    /**
     * DB 한글 라벨에서 Enum 상수로 변환합니다.
     *
     * @param dbValue DB에 저장된 한글 라벨
     * @return 매핑된 주문 상태
     * @throws IllegalArgumentException 알 수 없는 라벨인 경우
     */
    public static OrderStatus from(String dbValue) {
        for (OrderStatus v : values()) {
            if (v.dbValue.equals(dbValue)) return v;
        }
        throw new IllegalArgumentException("Unknown OrderStatus dbValue=" + dbValue);
    }
}
```

## File: src/main/java/com/boot/ict05_final_user/domain/order/entity/CustomerOrderDetail.java
```java
package com.boot.ict05_final_user.domain.order.entity;

import com.boot.ict05_final_user.domain.menu.entity.Menu;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.math.BigDecimal;

/**
 * 주문 상세(CustomerOrderDetail) 엔티티.
 *
 * <p>주문에 포함된 개별 메뉴/수량/단가/금액 정보를 보관합니다.
 * 단가와 수량을 기반으로 라인 합계(lineTotal)를 자동 계산합니다.</p>
 */
@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "customer_order_detail")
@Schema(description = "주문 상세 엔티티")
public class CustomerOrderDetail {

    /** 주문 상세 시퀀스 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "customer_order_detail_id")
    @Schema(description = "주문 상세 ID", accessMode = Schema.AccessMode.READ_ONLY)
    private Long id;

    /** 주문(FK) */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_order_id_fk", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @Setter
    @Schema(description = "상위 주문", implementation = CustomerOrder.class, nullable = false)
    private CustomerOrder order;

    /** 메뉴 시퀀스(FK) */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "menu_id_fk", nullable = false)
    @Schema(description = "해당 라인의 메뉴", implementation = Menu.class, nullable = false)
    private Menu menuIdFk;

    /** 주문 수량 */
    @Column(name = "customer_order_detail_quantity", nullable = false)
    @Schema(description = "주문 수량", nullable = false)
    private Integer quantity;

    /** 단가 (당시 메뉴 가격 스냅샷) */
    @Column(name = "customer_order_detail_unit_price", precision = 15, scale = 2, nullable = false)
    @Schema(description = "단가(BigDecimal)", nullable = false)
    private BigDecimal unitPrice;

    /** 주문 금액(해당 라인 총액 = 단가 × 수량) */
    @Column(name = "customer_order_detail_total", precision = 15, scale = 2, nullable = false)
    @Schema(description = "라인 합계(단가×수량)", nullable = false)
    private BigDecimal lineTotal;

    /**
     * 영속/수정 직전 훅에서 라인 합계를 계산합니다.
     *
     * <p>수량이 없으면 1, 단가가 없으면 0으로 간주하여 계산합니다.</p>
     */
    @PrePersist
    @PreUpdate
    void calculateLineTotal() {
        if (quantity == null) quantity = 1;
        if (unitPrice == null) unitPrice = BigDecimal.ZERO;
        this.lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
    }
}
```

## File: src/main/java/com/boot/ict05_final_user/domain/order/entity/CustomerOrder.java
```java
package com.boot.ict05_final_user.domain.order.entity;

import com.boot.ict05_final_user.domain.store.entity.Store;
import jakarta.persistence.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 주문(CustomerOrder) 엔티티.
 *
 * <p>주문 기본정보(매장, 상태, 결제유형, 주문일시, 총금액 등)를 담습니다.</p>
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "customer_order")
@Schema(description = "주문 엔티티")
public class CustomerOrder {

    /** 주문 시퀀스 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "customer_order_id")
    @Schema(description = "주문 ID", accessMode = Schema.AccessMode.READ_ONLY)
    private Long id;

    /** 매장 시퀀스(FK) */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_id_fk", nullable = false)
    @Schema(description = "주문 소속 매장", implementation = Store.class, nullable = false)
    private Store store;

    /** 주문 코드(예: YYYYMMDD-XXXX 등) */
    @Column(name = "customer_order_code", unique = true)
    @Schema(description = "주문 코드")
    private String orderCode;

    /** 주문 상태 (대기/준비중/완료/취소) */
    @Enumerated(EnumType.STRING)
    @Column(name = "customer_order_status", nullable = false)
    @Schema(description = "주문 상태", implementation = OrderStatus.class, nullable = false)
    private OrderStatus status;

    /** 주문 총금액 */
    @Column(name = "customer_order_total_price", precision = 15, scale = 2, nullable = false)
    @Schema(description = "총 결제 금액", nullable = false)
    private BigDecimal totalPrice;

    /** 주문 일시 */
    @Schema(type = "string", format = "date-time", description = "주문(접수) 시각", accessMode = Schema.AccessMode.READ_ONLY)
    @Column(name = "customer_order_date", nullable = false)
    private LocalDateTime orderedAt;

    /** 주문 형태 (visit/takeout/delivery) */
    @Enumerated(EnumType.STRING)
    @Column(name = "customer_order_type", nullable = false)
    @Schema(description = "주문 유형", implementation = OrderType.class, nullable = false)
    private OrderType orderType;

    /** 결제 방식 (card/cash/voucher/external) */
    @Enumerated(EnumType.STRING)
    @Column(name = "customer_order_payment_type", nullable = false)
    @Schema(description = "결제 수단", implementation = PaymentType.class, nullable = false)
    private PaymentType paymentType;

    /** 할인 금액(없으면 0.00) */
    @Builder.Default
    @Column(name = "customer_order_discount", precision = 15, scale = 2, nullable = false)
    @Schema(description = "할인 금액", nullable = false)
    private BigDecimal discount = BigDecimal.ZERO;

    /** 비고 */
    @Column(name = "customer_order_memo")
    @Schema(description = "비고/메모")
    private String memo;

    /** 고객 전화번호 */
    @Column(name = "customer_phone")
    @Schema(description = "고객 전화번호")
    private String customerPhone;

    /** 배달 주소 */
    @Schema(description = "배달 주소")
    private String deliveryAddress;

    /** 주문 상세 목록 */
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    @Schema(description = "주문 품목 목록", implementation = CustomerOrderDetail.class)
    private List<CustomerOrderDetail> details;

    /** 기본값 설정 훅 */
    @PrePersist
    void prePersist() {
        if (discount == null) discount = BigDecimal.ZERO;
        if (orderedAt == null) orderedAt = LocalDateTime.now();
        if (status == null) status = OrderStatus.PENDING;
    }
}
```

## File: src/main/java/com/boot/ict05_final_user/domain/order/entity/OrderType.java
```java
package com.boot.ict05_final_user.domain.order.entity;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * 주문 형태 Enum.
 *
 * <p>방문/포장/배달의 주문 유형을 표현하며, DB 저장용 코드와 한글 라벨을 함께 보유합니다.</p>
 */
@Schema(description = "주문 형태", allowableValues = {"VISIT", "TAKEOUT", "DELIVERY"})
public enum OrderType {
    VISIT("VISIT", "방문"),
    TAKEOUT("TAKEOUT", "포장"),
    DELIVERY("DELIVERY", "배달");

    /** DB 저장용 코드 */
    private final String dbValue;

    /** 화면 표기를 위한 한글 라벨 */
    private final String label;

    OrderType(String dbValue, String label) {
        this.dbValue = dbValue;
        this.label = label;
    }

    /** DB 저장용 코드를 반환합니다. */
    public String getDbValue() { return dbValue; }

    /** 한글 라벨을 반환합니다. */
    public String getLabel()   { return label; }

    /**
     * DB 저장용 코드에서 Enum으로 변환합니다.
     *
     * @param dbValue DB 저장용 코드
     * @return 매핑된 주문 형태
     * @throws IllegalArgumentException 알 수 없는 코드인 경우
     */
    public static OrderType from(String dbValue) {
        for (OrderType v : values()) if (v.dbValue.equals(dbValue)) return v;
        throw new IllegalArgumentException("Unknown OrderType dbValue=" + dbValue);
    }
}
```

## File: front-end/src/components/Store/OrderList.tsx
```tsx
// src/pages/OrderList.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui/tabs';

import {
  Search,
  MapPin,
  XCircle,
  Package,
  Store,
  ShoppingBag,
  Car,
  Eye,
  MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';

/* =========================
   axios 공통 인스턴스
========================= */
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken'); // 또는 'storeAccessToken'
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* =========================
   타입 정의
========================= */

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  options?: string[];
}

interface Order {
  /** 백엔드 PK (PATCH 용도) */
  orderPk: number;

  /** 화면에 보여줄 주문번호 (#0001 형식) */
  id: string;

  items: OrderItem[];
  total: number;
  originalTotal: number;
  discount: number;
  status:
    | 'pending'
    | 'preparing'
    | 'cooking'
    | 'ready'
    | 'completed'
    | 'cancelled';
  orderTime: Date;
  customer?: string;
  paymentMethod: string;
  orderType: '방문' | '포장' | '배달';
  customerPhone?: string;
  deliveryAddress?: string;
  cancelReason?: string;
}

// 백엔드 응답은 필드명이 조금씩 다를 수 있으니 any로 받아서 매핑
type BackendOrder = any;

type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // 현재 페이지 (0-based)
  size: number;
};

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  // 상단 검색/필터
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all'); // all/today/week/month

  // 탭은 상태 필터와 동일하게 사용
  const currentTab = statusFilter;

  // 서버 페이징 상태
  const PAGE_SIZE = 20;
  const MAX_PAGE_BUTTONS = 10;
  const [page, setPage] = useState(0); // 0-based
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  /* =========================
     백엔드 → 화면 타입 매핑
  ========================= */

  const mapStatus = (statusRaw: string | undefined): Order['status'] => {
    const s = (statusRaw || '').toUpperCase();
    switch (s) {
      case 'PENDING':
        return 'pending';
      case 'PREPARING':
        return 'preparing';
      case 'COOKING':
        return 'cooking';
      case 'READY':
        return 'ready';
      case 'COMPLETED':
        return 'completed';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'cancelled';
      case 'PAID':
        return 'pending';
      default:
        return 'pending';
    }
  };

  const mapOrderType = (typeRaw: string | undefined): Order['orderType'] => {
    const t = (typeRaw || '').toUpperCase();
    switch (t) {
      case 'VISIT':
        return '방문';
      case 'TAKEOUT':
        return '포장';
      case 'DELIVERY':
        return '배달';
      default:
        return '방문';
    }
  };

  const mapPaymentMethod = (pRaw: string | undefined): string => {
    const p = (pRaw || '').toLowerCase();
    switch (p) {
      case 'card':
        return '카드결제';
      case 'cash':
        return '현금결제';
      case 'voucher':
        return '상품권결제';
      case 'external':
        return '외부결제';
      default:
        return pRaw || '-';
    }
  };

  const mapBackendOrderToOrder = (o: BackendOrder): Order => {
    const pk: number = Number(o.id ?? o.customerOrderId ?? 0);

    const orderCode: string =
      o.orderCode ?? o.customerOrderCode ?? `#${String(pk).padStart(4, '0')}`;

    const total = Number(o.totalPrice ?? o.customerOrderTotalPrice ?? 0);
    const discount = Number(o.discount ?? o.customerOrderDiscount ?? 0);

    const status = mapStatus(
      o.status ?? o.orderStatus ?? o.customerOrderStatus,
    );
    const orderType = mapOrderType(o.orderType ?? o.customerOrderType);
    const paymentMethod = mapPaymentMethod(
      o.paymentType ?? o.customerOrderPaymentType,
    );

    const dateStr =
      o.orderDate ??
      o.customerOrderDate ??
      o.orderedAt ??
      o.createdAt ??
      new Date().toISOString();
    const orderTime = new Date(dateStr);

    const customerName = o.customerName ?? o.memo ?? o.customer ?? null;
    const phone = o.customerPhone ?? o.phone ?? o.contact ?? null;
    const address = o.deliveryAddress ?? o.address ?? null;

    const items: OrderItem[] = Array.isArray(o.items)
      ? o.items.map((i: any, idx: number) => ({
          id: i.menuId ?? idx,
          name: i.menuName ?? '메뉴',
          price: Number(i.unitPrice ?? 0),
          quantity: Number(i.quantity ?? 0),
          image: '',
          options: [],
        }))
      : [];

    return {
      orderPk: pk,
      id: orderCode,
      items,
      total,
      originalTotal: total + discount,
      discount,
      status,
      orderTime,
      customer: customerName || undefined,
      paymentMethod,
      orderType,
      customerPhone: phone || undefined,
      deliveryAddress: address || undefined,
      cancelReason: undefined,
    };
  };

  /* =========================
     주문 목록 조회
  ========================= */

  // UI 상태값 → 백엔드 enum 이름
  const toBackendStatus = (v: string) => {
    if (!v || v === 'all') return undefined;
    return v.toUpperCase(); // pending -> PENDING
  };

  const toBackendPaymentType = (v: string) => {
    switch (v) {
      case '카드결제':
        return 'CARD';
      case '현금결제':
        return 'CASH';
      case '상품권결제':
        return 'VOUCHER';
      default:
        return undefined; // 'all' 포함
    }
  };

  const toBackendOrderType = (v: string) => {
    switch (v) {
      case '방문':
        return 'VISIT';
      case '포장':
        return 'TAKEOUT';
      case '배달':
        return 'DELIVERY';
      default:
        return undefined; // 'all' 포함
    }
  };

  // 필터 바뀌면 0페이지로 리셋
  useEffect(() => {
    setPage(0);
  }, [searchTerm, statusFilter, paymentFilter, orderTypeFilter, dateFilter]);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await api.get<PageResponse<BackendOrder>>(
          '/api/customer-orders',
          {
            params: {
              page,
              size: PAGE_SIZE,
              keyword: searchTerm || undefined,
              status: toBackendStatus(statusFilter),
              paymentType: toBackendPaymentType(paymentFilter),
              orderType: toBackendOrderType(orderTypeFilter),
              period: dateFilter || 'all',
            },
          },
        );

        const data: any = res.data;

        // 응답이 리스트(List) 인지 Page 인지 둘 다 대응
        const raw: BackendOrder[] = Array.isArray(data)
          ? data
          : data.content ?? [];

        const mapped = raw.map(mapBackendOrderToOrder);

        const totalPages =
          Array.isArray(data) ? 1 : data.totalPages ?? 1;

        const totalElements =
          Array.isArray(data) ? raw.length : data.totalElements ?? raw.length;

        setOrders(mapped);
        setTotalPages(totalPages);
        setTotalCount(totalElements);
      } catch (e) {
        console.error('주문 목록 조회 오류:', e);
        toast.error('주문 목록을 불러오지 못했습니다.');
        setOrders([]);
        setTotalPages(1);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [page, searchTerm, statusFilter, paymentFilter, orderTypeFilter, dateFilter]);

  /* =========================
     유틸 함수들
  ========================= */

  const getOrderCountByStatus = (status: string) => {
    if (status === 'all') return orders.length;
    return orders.filter((order) => order.status === status).length;
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: '대기중', className: 'bg-yellow-100 text-yellow-800' },
      preparing: { label: '준비중', className: 'bg-blue-100 text-blue-800' },
      cooking: { label: '조리중', className: 'bg-orange-100 text-orange-800' },
      ready: { label: '완료', className: 'bg-green-100 text-green-800' },
      completed: { label: '픽업완료', className: 'bg-gray-100 text-gray-800' },
      cancelled: { label: '취소', className: 'bg-red-100 text-red-800' },
    };

    const config =
      statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case '방문':
        return <Store className="w-4 h-4" />;
      case '포장':
        return <ShoppingBag className="w-4 h-4" />;
      case '배달':
        return <Car className="w-4 h-4" />;
      default:
        return <Store className="w-4 h-4" />;
    }
  };

  const updateOrderStatus = async (order: Order, newStatus: string) => {
    try {
      await api.patch(`/api/customer-orders/${order.orderPk}/status`, {
        status: newStatus,
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.orderPk === order.orderPk
            ? { ...o, status: newStatus as Order['status'] }
            : o,
        ),
      );
      toast.success(`주문 ${order.id} 상태가 ${newStatus}로 변경되었습니다.`);
    } catch (e) {
      console.error('상태 변경 오류:', e);
      toast.error('주문 상태 변경에 실패했습니다.');
    }
  };

  const cancelOrder = async (order: Order, reason: string) => {
    try {
      await api.patch(`/api/customer-orders/${order.orderPk}/status`, {
        status: 'CANCELLED',
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.orderPk === order.orderPk
            ? { ...o, status: 'cancelled', cancelReason: reason }
            : o,
        ),
      );
      toast.success(`주문 ${order.id}가 취소되었습니다.`);
    } catch (e) {
      console.error('주문 취소 오류:', e);
      toast.error('주문 취소에 실패했습니다.');
    }
  };

  const formatTime = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('ko-KR');
  };

  const formatDateTime = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleString('ko-KR');
  };

  const todayCount = totalCount;
  const startIndex = totalCount === 0 ? 0 : page * PAGE_SIZE + 1;
  const endIndex = Math.min(totalCount, (page + 1) * PAGE_SIZE);

  // 🔥 여기 추가: 페이지 버튼 최대 10개만 보이도록 계산
  const getPageNumbers = () => {
    if (totalPages <= MAX_PAGE_BUTTONS) {
      // 전체 페이지 수가 10개 이하이면 전부 표시
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    const half = Math.floor(MAX_PAGE_BUTTONS / 2);
    let start = Math.max(0, page - half);
    let end = start + MAX_PAGE_BUTTONS - 1;

    if (end >= totalPages) {
      end = totalPages - 1;
      start = Math.max(0, end - MAX_PAGE_BUTTONS + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  /* =========================
     JSX
  ========================= */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>주문 리스트</h1>
          <p className="text-dark-gray">
            오늘 총 {todayCount}건의 주문
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          {/* 검색 */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="주문번호, 고객명, 전화번호, 메뉴명으로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* 상태 필터 */}
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="pending">대기중</SelectItem>
              <SelectItem value="preparing">준비중</SelectItem>
              <SelectItem value="cooking">조리중</SelectItem>
              <SelectItem value="ready">완료</SelectItem>
              <SelectItem value="completed">픽업완료</SelectItem>
              <SelectItem value="cancelled">취소</SelectItem>
            </SelectContent>
          </Select>

          {/* 결제 필터 */}
          <Select
            value={paymentFilter}
            onValueChange={setPaymentFilter}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="결제방법" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 결제</SelectItem>
              <SelectItem value="카드결제">카드결제</SelectItem>
              <SelectItem value="현금결제">현금결제</SelectItem>
              <SelectItem value="상품권결제">상품권결제</SelectItem>
            </SelectContent>
          </Select>

          {/* 유형 필터 */}
          <Select
            value={orderTypeFilter}
            onValueChange={setOrderTypeFilter}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="주문유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 유형</SelectItem>
              <SelectItem value="방문">방문</SelectItem>
              <SelectItem value="포장">포장</SelectItem>
              <SelectItem value="배달">배달</SelectItem>
            </SelectContent>
          </Select>

          {/* 기간 필터 */}
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="기간" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="today">오늘</SelectItem>
              <SelectItem value="week">일주일</SelectItem>
              <SelectItem value="month">한 달</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Orders Table */}
      <Card>
        <Tabs
          value={currentTab}
          onValueChange={(value) => setStatusFilter(value)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="all">
              전체 ({getOrderCountByStatus('all')})
            </TabsTrigger>
            <TabsTrigger value="pending">
              대기 ({getOrderCountByStatus('pending')})
            </TabsTrigger>
            <TabsTrigger value="preparing">
              준비 ({getOrderCountByStatus('preparing')})
            </TabsTrigger>
            <TabsTrigger value="cooking">
              조리 ({getOrderCountByStatus('cooking')})
            </TabsTrigger>
            <TabsTrigger value="ready">
              완료 ({getOrderCountByStatus('ready')})
            </TabsTrigger>
            <TabsTrigger value="completed">
              픽업완료 ({getOrderCountByStatus('completed')})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              취소 ({getOrderCountByStatus('cancelled')})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={currentTab} className="p-0">
            {loading ? (
              <div className="text-center py-16">
                <p className="text-gray-500">주문 목록을 불러오는 중입니다...</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                          주문번호
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                          주문시간
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                          주문내역
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                          유형
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                          금액
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                          결제
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                          상태
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                          액션
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.map((order) => (
                        <tr key={order.orderPk} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {order.id}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-gray-900">
                                {formatTime(order.orderTime)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatDate(order.orderTime)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              {order.items.slice(0, 2).map((item, index) => (
                                <div
                                  key={index}
                                  className="text-sm text-gray-900"
                                >
                                  {item.name} x{item.quantity}
                                </div>
                              ))}
                              {order.items.length > 2 && (
                                <div className="text-sm text-gray-500">
                                  외 {order.items.length - 2}개
                                </div>
                              )}
                              {order.items.length === 0 && (
                                <div className="text-sm text-gray-400">
                                  (메뉴 정보 미연동)
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {getOrderTypeIcon(order.orderType)}
                              <span className="text-gray-900">
                                {order.orderType}
                              </span>
                            </div>
                            {order.orderType === '배달' &&
                              order.deliveryAddress && (
                                <div className="text-sm text-gray-500 mt-1">
                                  <MapPin className="w-3 h-3 inline mr-1" />
                                  {order.deliveryAddress.slice(0, 20)}...
                                </div>
                              )}
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-semibold text-gray-900">
                                {(order.total || 0).toLocaleString()}원
                              </div>
                              {order.discount > 0 && (
                                <div className="text-sm text-red-500">
                                  -{order.discount.toLocaleString()}원 할인
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-900">
                              {order.paymentMethod}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              {getStatusBadge(order.status)}
                              {order.status === 'cancelled' &&
                                order.cancelReason && (
                                  <div className="text-sm text-gray-500 mt-1">
                                    {order.cancelReason}
                                  </div>
                                )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedOrder(order)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>

                              {order.status !== 'cancelled' &&
                                order.status !== 'completed' && (
                                  <Select
                                    value={order.status}
                                    onValueChange={(value: any) =>
                                      value === 'cancelled'
                                        ? cancelOrder(order, '관리자 취소')
                                        : updateOrderStatus(order, value)
                                    }
                                  >
                                    <SelectTrigger className="h-8 w-8 p-0 border-none bg-transparent hover:bg-gray-100">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="preparing">
                                        준비중
                                      </SelectItem>
                                      <SelectItem value="cooking">
                                        조리중
                                      </SelectItem>
                                      <SelectItem value="ready">
                                        완료
                                      </SelectItem>
                                      <SelectItem value="completed">
                                        픽업완료
                                      </SelectItem>
                                      <SelectItem value="cancelled">
                                        취소
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 페이지네이션 */}
                {totalCount > 0 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t">
                    <div className="text-sm text-gray-500">
                      총 {totalCount}건 중{' '}
                      {totalCount === 0 ? 0 : `${startIndex}–${endIndex}건`} 표시
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                      >
                        이전
                      </Button>

                      {/* 🔥 여기만 수정: getPageNumbers 사용 */}
                      {getPageNumbers().map((p) => (
                        <Button
                          key={p}
                          variant={p === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPage(p)}
                        >
                          {p + 1}
                        </Button>
                      ))}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPage((p) => Math.min(totalPages - 1, p + 1))
                        }
                        disabled={page >= totalPages - 1}
                      >
                        다음
                      </Button>
                    </div>
                  </div>
                )}

                {totalCount === 0 && !loading && (
                  <div className="text-center py-16">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      주문이 없습니다
                    </h3>
                    <p className="text-gray-500">
                      조건에 맞는 주문이 없습니다.
                    </p>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      {/* 상세 모달 */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2>주문 상세 정보</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrder(null)}
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">주문번호</label>
                    <p>{selectedOrder.id}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">주문시간</label>
                    <p>{formatDateTime(selectedOrder.orderTime)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">고객명</label>
                    <p>{selectedOrder.customer || '고객'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">연락처</label>
                    <p>{selectedOrder.customerPhone || '-'}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-500">주문 내역</label>
                  <div className="mt-2 space-y-2">
                    {selectedOrder.items.length === 0 && (
                      <div className="text-sm text-gray-400">
                        메뉴 상세는 아직 미연동 상태입니다.
                      </div>
                    )}
                    {selectedOrder.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <span>{item.image}</span>
                          <span>{item.name}</span>
                          <span className="text-gray-500">
                            x{item.quantity}
                          </span>
                        </div>
                        <span>
                          {(item.price * item.quantity).toLocaleString()}원
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span>소계</span>
                    <span>
                      {selectedOrder.originalTotal.toLocaleString()}원
                    </span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between items-center text-red-500">
                      <span>할인</span>
                      <span>
                        -{selectedOrder.discount.toLocaleString()}원
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-medium border-t mt-2 pt-2">
                    <span>총 결제금액</span>
                    <span>
                      {selectedOrder.total.toLocaleString()}원
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">결제방법</label>
                    <p>{selectedOrder.paymentMethod}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">주문유형</label>
                    <p>{selectedOrder.orderType}</p>
                  </div>
                </div>

                {selectedOrder.deliveryAddress && (
                  <div>
                    <label className="text-sm text-gray-500">배달주소</label>
                    <p>{selectedOrder.deliveryAddress}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm text-gray-500">주문상태</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
```

## File: front-end/src/components/Store/OrderSystem.tsx
```tsx
// src/pages/OrderSystem.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { useOrder } from '../Common/OrderContext';
import {
  Plus,
  Minus,
  ShoppingCart,
  CreditCard,
  X,
  Store,
  Package,
  Truck,
  Gift,
  Percent,
} from 'lucide-react';
import { toast } from 'sonner';

/* ============================
   공통 axios 인스턴스
============================ */
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  // 🔥 로그인할 때 localStorage에 저장한 토큰 키 이름과 반드시 같아야 함!!
  const token = localStorage.getItem('accessToken'); // 예: 'accessToken' / 'storeAccessToken'

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


/* ============================
   타입 정의
============================ */
type SoldOutStatus = 'ON_SALE' | 'SOLD_OUT';
type MenuShow = 'SHOW' | 'HIDE';

export type StoreMenu = {
  menuId: number;
  menuName: string;
  menuNameEnglish: string;
  menuCategoryId: number;
  menuCategoryName: string;
  menuPrice: number;
  menuKcal: number;
  menuInformation: string;
  menuCode: string;
  ingredients: string;

  // 🔥 백엔드 필드 그대로 사용
  storeMenuSoldout: SoldOutStatus;

  menuShow: MenuShow;
};

type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
};

interface MenuItem {
  id: number;
  name: string;
  price: number;
  image: string;
  available: boolean; // ← 품절 여부
}

interface MenuCategoryWithItems {
  id: string;
  name: string;
  items: MenuItem[];
}

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  options?: string[];
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  originalTotal: number;
  discount: number;
  status: 'preparing' | 'cooking' | 'ready' | 'completed';
  orderTime: Date | string;
  customer?: string;
  paymentMethod: string;
  orderType: '방문' | '포장' | '배달';
}

/* ============================
   유틸: 카테고리별 이모지
============================ */
const getEmojiForCategory = (categoryName: string) => {
  if (categoryName.includes('세트') || categoryName.includes('버거')) return '🍔';
  if (categoryName.includes('토스트')) return '🥪';
  if (categoryName.includes('사이드') || categoryName.includes('튀김')) return '🍟';
  if (categoryName.includes('음료') || categoryName.includes('콜라') || categoryName.includes('사이다')) return '🥤';
  return '🍔';
};

const ALL_CATEGORY_KEY = 'ALL';
const PAGE_SIZE = 16;
const EXCLUDED_CATEGORY_NAMES = ['메뉴'];


/* ============================
    주문 등록 화면
============================ */
export function OrderSystem() {
  const [menuCategories, setMenuCategories] = useState<MenuCategoryWithItems[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORY_KEY);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [cart, setCart] = useState<OrderItem[]>([]);
  const [orderType, setOrderType] = useState<'방문' | '포장' | '배달'>('방문');
  const [customerName, setCustomerName] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [paymentMethod, setPaymentMethod] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [customDiscountValue, setCustomDiscountValue] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);

  const { addOrder } = useOrder();

  /* ============================
      시계
  ============================ */
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ============================
      메뉴 조회 (DB → 프론트 변환)
  ============================ */
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const pageSize = 200;
        let page = 0;
        let totalPages = 1;
        const all: StoreMenu[] = [];

        do {
          const res = await api.get<PageResponse<any>>('/API/menu/list', {
            params: { page, size: pageSize },
          });

          const data = res.data?.content ?? [];
          totalPages = res.data?.totalPages ?? 1;

          const normalized: StoreMenu[] = data.map((m: any) => ({
            menuId: m.menuId,
            menuName: m.menuName,
            menuNameEnglish: m.menuNameEnglish,
            menuCategoryId: m.menuCategoryId,
            menuCategoryName: m.menuCategoryName,
            menuPrice: m.menuPrice,
            menuKcal: m.menuKcal,
            menuInformation: m.menuInformation,
            menuCode: m.menuCode,
            ingredients: m.ingredients ?? '',
            menuShow: m.menuShow,
            storeMenuSoldout: m.storeMenuSoldout ?? 'ON_SALE', // ⭐ 핵심
          }));

          all.push(...normalized);
          page += 1;
        } while (page < totalPages);

        const categoryMap = new Map<string, MenuCategoryWithItems>();

        all.forEach((m) => {
          const catId = String(m.menuCategoryId);
          const catName = (m.menuCategoryName ?? '').trim();

          if (EXCLUDED_CATEGORY_NAMES.includes(catName)) return;
          if (m.menuShow !== 'SHOW') return;

          const emoji = getEmojiForCategory(catName);

          // 품절 여부 판단
          const available = m.storeMenuSoldout === 'ON_SALE';

          if (!categoryMap.has(catId)) {
            categoryMap.set(catId, { id: catId, name: catName, items: [] });
          }

          categoryMap.get(catId)!.items.push({
            id: m.menuId,
            name: m.menuName,
            price: m.menuPrice,
            image: emoji,
            available,
          });
        });

        const categoryList = [...categoryMap.values()]
          .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
          .map((c) => ({
            ...c,
            items: c.items.sort((a, b) => a.name.localeCompare(b.name, 'ko')),
          }));

        setMenuCategories(categoryList);
        setSelectedCategory(ALL_CATEGORY_KEY);
        setCurrentPage(1);
      } catch (e) {
        console.error('메뉴 조회 실패:', e);
        toast.error('메뉴를 불러오지 못했습니다.');
      }
    };

    fetchMenus();
  }, []);

  /* ============================
      주문 히스토리 로드
  ============================ */
  useEffect(() => {
    const existingOrders = localStorage.getItem('allOrders');
    if (existingOrders) {
      try {
        const parsed = JSON.parse(existingOrders);
        setOrders(parsed);
      } catch (e) {}
    }
  }, []);

  /* ============================
      장바구니 추가
  ============================ */
  const addToCart = (item: MenuItem | OrderItem) => {
    const available = (item as MenuItem).available;
    if (!available) {
      toast.error('품절된 상품입니다.');
      return;
    }

    const exists = cart.find((c) => c.id === item.id);
    if (exists) {
      setCart(
        cart.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c,
        ),
      );
    } else {
      setCart([
        ...cart,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          image: item.image,
        },
      ]);
    }
  };

  /* ============================
      장바구니 감소/삭제
  ============================ */
  const removeFromCart = (id: number) => {
    const existing = cart.find((i) => i.id === id);
    if (existing && existing.quantity > 1) {
      setCart(
        cart.map((i) =>
          i.id === id ? { ...i, quantity: i.quantity - 1 } : i,
        ),
      );
    } else {
      setCart(cart.filter((i) => i.id !== id));
    }
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
  };

  /* ============================
      가격 계산
  ============================ */
  const subtotal = () =>
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const total = () => {
    const s = subtotal();
    if (discountType === 'percent') return s - (s * discount) / 100;
    return s - discount;
  };

  /* ============================
      결제처리 → 백엔드 주문 생성
  ============================ */
  const processPayment = async (method: string) => {
    if (cart.length === 0) {
      toast.error('상품을 선택하세요');
      return;
    }

    try {
      const stored = JSON.parse(localStorage.getItem('allOrders') || '[]');

      let max = 0;
      [...stored, ...orders].forEach((o) => {
        const n = parseInt(String(o.id).replace('#', ''), 10);
        if (!isNaN(n) && n > max) max = n;
      });

      const orderId = `#${String(max + 1).padStart(4, '0')}`;

      const s = subtotal();
      const t = total();
      const disc = s - t;

      const mapOrderType = {
        방문: 'VISIT',
        포장: 'TAKEOUT',
        배달: 'DELIVERY',
      };

      const mapPayment = {
        현금: 'cash',
        카드: 'card',
        상품권: 'voucher',
      };

      await api.post('/api/customer-orders', {
        // storeId 안 보냄
        orderCode: orderId,
        orderType: mapOrderType[orderType],
        paymentType: mapPayment[method] || 'cash',
        totalPrice: t,
        discount: disc,
        customerName: customerName || null,
        items: cart.map((item) => ({
          menuId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
      });

      const newOrder: Order = {
        id: orderId,
        items: [...cart],
        total: t,
        originalTotal: s,
        discount: disc,
        status: 'preparing',
        orderTime: new Date(),
        customer: customerName || undefined,
        paymentMethod: method,
        orderType,
      };

      const updated = [newOrder, ...orders];
      setOrders(updated);

      localStorage.setItem(
        'allOrders',
        JSON.stringify([newOrder, ...stored]),
      );

      addOrder({
        items: cart.map((item) => ({
          id: String(item.id),
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        totalAmount: t,
        orderType: mapOrderType[orderType],
        paymentMethod: mapPayment[method] || 'cash',
        status: 'preparing',
      });

      toast.success(`결제완료: ${orderId}`);
      setCart([]);
      setCustomerName('');
      setDiscount(0);
    } catch (e) {
      console.error(e);
      toast.error('결제 오류');
    }
  };

  /* ============================
      카테고리 필터링 / 페이지 처리
  ============================ */
  const filteredItems =
    selectedCategory === ALL_CATEGORY_KEY
      ? menuCategories.flatMap((c) => c.items)
      : menuCategories.find((c) => c.id === selectedCategory)?.items ?? [];

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));

  const pageItems = filteredItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    (currentPage - 1) * PAGE_SIZE + PAGE_SIZE,
  );

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
  };

  /* ============================
      JSX
  ============================ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">주문 등록</h1>
          <p className="text-dark-gray">
            {currentTime.toLocaleString('ko-KR')} | {orderType} 주문
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 메뉴 영역 */}
        <div className="col-span-8">
          <div className="sticky top-0 bg-white pb-3 z-10">
            <div className="flex gap-2 mb-2 overflow-x-auto">

              {/* 전체 탭 */}
              <Button
                key="all"
                onClick={() => {
                  setSelectedCategory(ALL_CATEGORY_KEY);
                  setCurrentPage(1);
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  selectedCategory === ALL_CATEGORY_KEY
                    ? 'bg-kpi-red text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                전체
              </Button>

              {/* 카테고리 탭 */}
              {menuCategories.map((c) => (
                <Button
                  key={c.id}
                  onClick={() => {
                    setSelectedCategory(c.id);
                    setCurrentPage(1);
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    selectedCategory === c.id
                      ? 'bg-kpi-red text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {c.name}
                </Button>
              ))}
            </div>
          </div>

          {/* 메뉴 카드 */}
          <div className="grid grid-cols-4 gap-4">
            {pageItems.map((item) => (
              <Card
                key={item.id}
                className={`p-4 cursor-pointer ${
                  item.available
                    ? 'hover:scale-105 hover:shadow-lg'
                    : 'opacity-40 cursor-not-allowed'
                }`}
                onClick={() => item.available && addToCart(item)}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">{item.image}</div>
                  <h3 className="font-medium mb-2">{item.name}</h3>
                  <div className="text-lg font-semibold text-kpi-red">
                    {item.price.toLocaleString()}원
                  </div>
                  {!item.available && (
                    <Badge variant="destructive" className="mt-2">
                      품절
                    </Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* 페이지네이션 */}
          {filteredItems.length > PAGE_SIZE && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => goToPage(currentPage - 1)}
              >
                이전
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => goToPage(p)}
                >
                  {p}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => goToPage(currentPage + 1)}
              >
                다음
              </Button>
            </div>
          )}
        </div>

        {/* 오른쪽 주문 내역 */}
        <div className="col-span-4">
          <Card className="p-4 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                주문 내역
              </h3>

              {cart.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* 고객 정보 */}
            <div className="mb-4 space-y-2">
              <Input
                placeholder="고객명 (선택)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />

              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={orderType === '방문' ? 'default' : 'outline'}
                  onClick={() => setOrderType('방문')}
                  className="flex-1"
                >
                  방문
                </Button>
                <Button
                  size="sm"
                  variant={orderType === '포장' ? 'default' : 'outline'}
                  onClick={() => setOrderType('포장')}
                  className="flex-1"
                >
                  포장
                </Button>
                <Button
                  size="sm"
                  variant={orderType === '배달' ? 'default' : 'outline'}
                  onClick={() => setOrderType('배달')}
                  className="flex-1"
                >
                  배달
                </Button>
              </div>
            </div>

            {/* 카트 */}
            <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2" />
                  주문할 상품을 선택하세요
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{item.image}</span>
                      <div>
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-gray-500">
                          {item.price.toLocaleString()}원
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFromCart(item.id)}
                        className="w-6 h-6 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>

                      <span className="mx-2 min-w-[20px] text-center">
                        {item.quantity}
                      </span>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addToCart(item)}
                        className="w-6 h-6 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 금액 */}
            {cart.length > 0 && (
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>소계</span>
                  <span>{subtotal().toLocaleString()}원</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>할인</span>
                    <span>
                      -{(subtotal() - total()).toLocaleString()}원
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                  <span>총액</span>
                  <span className="text-kpi-red">{total().toLocaleString()}원</span>
                </div>
              </div>
            )}

            {/* 결제 버튼 */}
            {cart.length > 0 && (
              <div className="space-y-2 mt-4">
                <Button
                  onClick={() => processPayment('카드')}
                  className="w-full bg-kpi-red text-white"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  카드 결제
                </Button>

                <Button
                  onClick={() => processPayment('현금')}
                  variant="outline"
                  className="w-full"
                >
                  <Package className="w-4 h-4 mr-2" />
                  현금 결제
                </Button>

                <Button
                  onClick={() => processPayment('상품권')}
                  variant="outline"
                  className="w-full"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  상품권 결제
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
```
