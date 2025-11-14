package com.boot.ict05_final_user.domain.order.entity;

/**
 * 결제 수단 유형을 표현하는 열거형(Enum)입니다.
 *
 * <p>주문 결제 시 사용되는 결제 수단을 카드, 현금, 상품권, 외부 결제 등으로 구분합니다.</p>
 */
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

	/**
	 * 결제 수단 열거값에 대응하는 한글 라벨을 설정합니다.
	 *
	 * @param label 화면에 표시할 결제 수단 이름(한글)
	 */
	PaymentType(String label) {
		this.label = label;
	}

	/**
	 * 화면 및 응답에 사용할 결제 수단 라벨(한글명)을 반환합니다.
	 *
	 * @return 결제 수단 라벨(한글명)
	 */
	public String getLabel() {
		return label;
	}
}
