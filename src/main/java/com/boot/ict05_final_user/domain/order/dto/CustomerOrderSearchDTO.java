package com.boot.ict05_final_user.domain.order.dto;

import lombok.Data;

@Data
public class CustomerOrderSearchDTO {

    /** 검색어: 주문번호, 고객명, 전화번호, 메뉴명 등 */
    private String keyword;

    /** 상태: PENDING, PREPARING, COOKING, READY, COMPLETED, CANCELLED */
    private String status;

    /** 결제: CARD, CASH, VOUCHER, EXTERNAL (또는 한글 라벨) */
    private String paymentType;

    /** 주문유형: VISIT, TAKEOUT, DELIVERY */
    private String orderType;

    /** 기간: all / today / week / month */
    private String period = "all";
}
