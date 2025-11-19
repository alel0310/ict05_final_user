package com.boot.ict05_final_user.domain.order.entity;

import com.boot.ict05_final_user.domain.store.entity.Store;
import jakarta.persistence.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 주문(CustomerOrder) 엔티티
 *
 * <p>주문 기본정보(매장, 상태, 결제유형, 주문일시, 총금액 등)를 담는다.</p>
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "customer_order")
public class CustomerOrder {

    /** 주문 시퀀스 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "customer_order_id")
    private Long id;

    /** 매장 시퀀스(FK) - 아직 Store 엔티티가 없으므로 Long 보관 */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_id_fk", nullable = false)
    private Store store;

    /** 주문 코드(예: YYYYMMDD-XXXX 등) */
    @Column(name = "customer_order_code", unique = true)
    private String orderCode;

    /** 주문 상태 (대기/준비중/완료/취소) → DB에는 한글 그대로 저장 */
    @Enumerated(EnumType.STRING)
    @Column(name = "customer_order_status", nullable = false)
    private OrderStatus status;

    /** 주문 총금액 */
    @Column(name = "customer_order_total_price", precision = 15, scale = 2, nullable = false)
    private BigDecimal totalPrice;

    /** 주문 일시 */
    @Schema(type = "string", format = "date-time")
    @Column(name = "customer_order_date", nullable = false)
    private LocalDateTime orderedAt;

    /** 주문 형태 (visit/takeout/delivery) → DB에는 영문 소문자 코드 저장 */
    @Enumerated(EnumType.STRING)
    @Column(name = "customer_order_type", nullable = false)
    private OrderType orderType;

    /** 결제 방식 (card/cash/voucher/external) → DB에는 영문 소문자 코드 저장 */
    @Enumerated(EnumType.STRING)
    @Column(name = "customer_order_payment_type", nullable = false)
    private PaymentType paymentType;

    /** 할인 금액(없으면 0.00) */
    @Builder.Default
    @Column(name = "customer_order_discount", precision = 15, scale = 2, nullable = false)
    private BigDecimal discount = BigDecimal.ZERO;

    /** 비고 */
    @Column(name = "customer_order_memo")
    private String memo;

    /** 고객 전화번호 */
    @Column(name = "customer_phone")
    private String customerPhone;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<CustomerOrderDetail> details;


    @PrePersist
    void prePersist() {
        if (discount == null) discount = BigDecimal.ZERO;
        if (orderedAt == null) orderedAt = LocalDateTime.now();
        if (status == null) status = OrderStatus.PENDING;
    }
}
