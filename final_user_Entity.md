package com.boot.ict05_final_user.domain.order.entity;

import com.boot.ict05_final_user.domain.store.entity.Store;
import jakarta.persistence.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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

    @PrePersist
    void prePersist() {
        if (discount == null) discount = BigDecimal.ZERO;
        if (orderedAt == null) orderedAt = LocalDateTime.now();
        if (status == null) status = OrderStatus.PENDING;
    }
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\menu\entity\Menu.java ---

package com.boot.ict05_final_user.domain.menu.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Menu {

    /** 메뉴 고유 ID */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "menu_id")
    private Long menuId;

    /** 메뉴명 */
    @Column(name = "menu_name")
    private String menuName;

    /** 메뉴코드 */
    @Column(name = "menu_code")
    private String menuCode;

    /** 메뉴 설명 */
    private String menuInformation;

    /** 메뉴 영문명 */
    private String menuNameEnglish;

    /** 메뉴 칼로리 */
    @Column(name = "menu_kcal")
    private Integer menuKcal;

    /** 품절 상태 */
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "sold_out_status")
    private SoldOutStatus soldOutStatus = SoldOutStatus.ON_SALE;

    /** 판매상태(0:중지, 1:판매중) */
    @Enumerated(EnumType.STRING)
    @Column(name = "menu_show")
    private MenuShow menuShow;

    /** 가격 */
    @Column(name = "menu_price")
    private BigDecimal menuPrice;

    /** 레시피(연결엔티티) */
    @OneToMany(mappedBy = "menu", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MenuRecipe> recipe = new ArrayList<>();

    /** menuCategory 참조 */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name= "menu_category_id_fk")
    private MenuCategory menuCategory;

    /** 재료 */
    @Column(name = "ingredients", length = 500)
    private String ingredients;

    /** 카테고리 교체 */
    public void changeCategory(MenuCategory category) { this.menuCategory = category; }

}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\staff\entity\StaffProfile.java ---

package com.boot.ict05_final_user.domain.staff.entity;

import com.boot.ict05_final_user.domain.store.entity.Store;
import com.boot.ict05_final_user.domain.user.entity.Member;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffProfile {

    /** 직원 시퀀스 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "staff_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id_fk", nullable = false)
    private Store store;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "member_id_fk",
            referencedColumnName = "member_id",
            foreignKey = @ForeignKey(name = "fk_staff_profile__member"),
            nullable = true,
            unique = true
    )
    private Member member;

    /** 직원 이름 */
    @Column(name = "staff_name", length = 100)
    private String staffName;

    /** 직원 근무형태 (점주/직원/알바) */
    @Enumerated(EnumType.STRING)
    @Column(name = "staff_employment_type")
    private StaffEmploymentType staffEmploymentType;

    /** 직원 부서 */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StaffDepartment staffDepartment = StaffDepartment.STORE; // 기본값 지정

    /** 직원 이메일 */
    @Column(name = "staff_email")
    private String staffEmail;

    /** 직원 전화번호 */
    @Column(name = "staff_phone", length = 50)
    private String staffPhone;

    /** 직원 주소 */
    @Column(name = "staff_address")
    private String staffAddress;

    /** 직원 생년월일 */
    @Schema(type = "string", format = "date-time")
    @Column(name = "staff_birth")
    private LocalDateTime staffBirth;

    /** 직원 입사일자 (혹은 매장 근무 시작일) */
    @Schema(type = "string", format = "date-time")
    @Column(name = "staff_start_date")
    private LocalDateTime staffStartDate;

    /** 직원 퇴사일자 */
    @Schema(type = "string", format = "date-time")
    @Column(name = "staff_end_date")
    private LocalDateTime staffEndDate;


}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\order\entity\PaymentType.java ---

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


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\fcm\entity\FcmStoreSendLog.java ---

package com.boot.ict05_final_user.domain.fcm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 가맹점용 FCM 발송 로그.
 * - 본사 fcm_send_log 와 별도 테이블 (fcm_store_send_log)
 * - 공지 / 재고부족 / 유통임박 / 테스트 공용으로 사용.
 */
@Entity
@Table(
        name = "fcm_store_send_log",
        indexes = {
                @Index(name = "ix_store_log_store", columnList = "store_id_fk"),
                @Index(name = "ix_store_log_member", columnList = "member_id_fk"),
                @Index(name = "ix_store_log_category", columnList = "category"),
                @Index(name = "ix_store_log_ref", columnList = "ref_type,ref_id"),
                @Index(name = "ix_store_log_ref_date", columnList = "ref_date")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FcmStoreSendLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long fcmStoreSendLogId;

    /** HQ/STORE 구분 (여기서는 주로 STORE) */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private AppType appType;

    /** NOTICE / STOCK_LOW / EXPIRE_SOON / TEST / 기타 */
    @Column(nullable = false, length = 32)
    private String category;

    /** 알림 기준이 되는 스토어/멤버 */
    @Column(name = "store_id_fk")
    private Long storeIdFk;

    @Column(name = "member_id_fk")
    private Long memberIdFk;

    /** 토픽 또는 토큰 */
    @Column(length = 255) // isTopic=true 일 때 채움
    private String topic;

    @Column(length = 512)
    private String token; // isTopic=false 일 때 채움

    /** 표시되는 타이틀/본문 */
    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 1000)
    private String body;

    /** data.link / WebpushFcmOptions link */
    @Column(length = 1024)
    private String link;

    /** 비즈니스 기준 (예: NOTICE / INVENTORY 등) */
    @Column(name = "ref_type", length = 32)
    private String refType;

    /** ref_type 에 따라 notice_id / 기타 PK */
    @Column(name = "ref_id")
    private Long refId;

    /** 재고/유통 스캔 기준일 등 */
    @Column(name = "ref_date")
    private LocalDate refDate;

    /** Firebase 가 리턴하는 messageId */
    @Column(name = "result_message_id", length = 255)
    private String resultMessageId;

    /** 에러 메시지(있다면) */
    @Column(name = "result_error", length = 512)
    private String resultError;

    /** 실제 발송 시각 */
    @Column(nullable = false)
    private LocalDateTime sentAt;

    /** 로우 생성시각 */
    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (sentAt == null) {
            sentAt = now;
        }
        if (createdAt == null) {
            createdAt = now;
        }
        if (appType == null) {
            appType = AppType.STORE;
        }
        if (category == null) {
            category = "GENERAL";
        }
    }
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\fcm\entity\AppType.java ---

package com.boot.ict05_final_user.domain.fcm.entity;

/** 앱 유형 분기 (HQ/STORE) */
public enum AppType {
    HQ, STORE
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\fcm\entity\FcmDeviceToken.java ---

package com.boot.ict05_final_user.domain.fcm.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "fcm_device_token",
        indexes = {
                @Index(name="ix_device_member", columnList = "member_id_fk"),
                @Index(name="ix_device_store",  columnList = "store_id_fk"),
                @Index(name="ix_device_staff",  columnList = "staff_id_fk")
        },
        uniqueConstraints = @UniqueConstraint(name="uq_fcm_token", columnNames = "token"))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FcmDeviceToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long fcmDeviceTokenId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private AppType appType; // HQ / STORE

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private PlatformType platform; // ANDROID / IOS / WEB

    @Column(nullable = false, length = 512)
    private String token;

    @Column(length = 128)
    private String deviceId;

    @Column(name = "member_id_fk")
    private Long memberIdFk;

    @Column(name = "store_id_fk")
    private Long storeIdFk;

    @Column(name = "staff_id_fk")
    private Long staffIdFk;

    @Column(nullable = false)
    private Boolean isActive = true;

    private LocalDateTime lastSeenAt;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    void onUpdate() { this.updatedAt = LocalDateTime.now(); }

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (isActive == null) isActive = true;
    }
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\fcm\entity\FcmPreference.java ---

package com.boot.ict05_final_user.domain.fcm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "fcm_preference",
		indexes = {
				@Index(name="ix_pref_member", columnList = "member_id_fk"),
				@Index(name="ix_pref_store",  columnList = "store_id_fk"),
				@Index(name="ix_pref_staff",  columnList = "staff_id_fk")
		})
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class FcmPreference {

	@Id @GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long fcmPreferenceId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 16)
	private AppType appType = AppType.STORE;

	@Column(name="member_id_fk")
	private Long memberIdFk;

	@Column(name="store_id_fk")
	private Long storeIdFk;

	@Column(name="staff_id_fk")
	private Long staffIdFk;

	@Column(nullable = false) private Boolean catNotice     = true;
	@Column(nullable = false) private Boolean catStockLow   = true;
	@Column(nullable = false) private Boolean catExpireSoon = true;

	@Column(nullable = false) private Integer thresholdDays = 3;

	@Column(nullable = false) private LocalDateTime createdAt = LocalDateTime.now();
	@Column(nullable = false) private LocalDateTime updatedAt = LocalDateTime.now();

	@PrePersist void onCreate() {
		LocalDateTime now = LocalDateTime.now();
		if (createdAt == null) createdAt = now;
		if (updatedAt == null) updatedAt = now;
		if (appType == null) appType = AppType.STORE;
		if (catNotice == null) catNotice = true;
		if (catStockLow == null) catStockLow = true;
		if (catExpireSoon == null) catExpireSoon = true;
		if (thresholdDays == null) thresholdDays = 3;
	}
	@PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\fcm\entity\PlatformType.java ---

package com.boot.ict05_final_user.domain.fcm.entity;

/** 단말 플랫폼 구분 */
public enum PlatformType {
    WEB, ANDROID, IOS
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\inventory\entity\AdjustmentReason.java ---

package com.boot.ict05_final_user.domain.inventory.entity;

/**
 * 재고 조정 사유 Enum
 *
 * <p>재고 조정 시 선택 가능한 사유를 정의하며, 각 항목은 한글 설명(description)을 가진다.</p>
 *
 * <p>조정 사유:</p>
 * <ul>
 *     <li>MANUAL: 수동 수정</li>
 *     <li>DAMAGE: 파손</li>
 *     <li>LOSS: 분실</li>
 *     <li>ERROR: 데이터 오류 정정</li>
 * </ul>
 */
public enum AdjustmentReason {

    /** 수동 수정 */
    MANUAL("수동 수정"),

    /** 파손 */
    DAMAGE("파손"),

    /** 분실 */
    LOSS("분실"),

    /** 데이터 오류 정정 */
    ERROR("데이터 오류 정정");

    /** 한글 설명 */
    private final String description;

    /**
     * 생성자
     *
     * @param description 각 조정 사유의 한글 설명
     */
    AdjustmentReason(String description) {
        this.description = description;
    }

    /**
     * 조정 사유의 한글 설명을 반환한다.
     *
     * @return 조정 사유 설명
     */
    public String getDescription() {
        return description;
    }
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\inventory\entity\InventoryBase.java ---

package com.boot.ict05_final_user.domain.inventory.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Comment;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 재고 공통 베이스
 *
 * <p>공통 필드와 공통 동작만 제공. 상태 계산은 {@link InventoryStatus}에 위임한다.</p>
 *
 * @author 김주연
 * @since 2025-11-11
 */
@Getter
@MappedSuperclass
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@SuperBuilder
public abstract class InventoryBase {

    /** 현재 수량 */
    @Builder.Default
    @Setter
    @Column(name = "inventory_quantity", precision = 15, scale = 3, nullable = false,
            columnDefinition = "DECIMAL(15,3) DEFAULT 0.000")
    @Comment("현재 수량")
    protected BigDecimal quantity = BigDecimal.ZERO;

    /** 적정 수량 */
    @Setter
    @Column(name = "inventory_optimal_quantity", precision = 15, scale = 3,
            columnDefinition = "DECIMAL(15,3)")
    @Comment("적정 수량")
    protected BigDecimal optimalQuantity;

    /** 재고 상태 */
    @Builder.Default
    @Setter
    @Enumerated(EnumType.STRING)
    @Column(name = "inventory_status", nullable = false, length = 20)
    @Comment("재고 상태")
    protected InventoryStatus status = InventoryStatus.SUFFICIENT;

    /** 마지막 업데이트 일시 */
    @Setter
    @Column(name = "inventory_update_date", nullable = false,
            columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP")
    @Comment("재고 수정일")
    protected LocalDateTime updateDate;

    /**
     * 재고 상태를 즉시 재계산해 반영한다.
     *
     * <p>수량 또는 적정 수량이 변경된 직후 호출한다.</p>
     * <ul>
     *   <li>수량 ≤ 0 → {@link InventoryStatus#SHORTAGE}</li>
     *   <li>적정 수량이 null → 수량 &gt; 0 이면 {@link InventoryStatus#SUFFICIENT}</li>
     *   <li>수량 &lt; 적정 수량 → {@link InventoryStatus#LOW}</li>
     *   <li>그 외 → {@link InventoryStatus#SUFFICIENT}</li>
     * </ul>
     */
    public final void updateStatusNow() {
        this.status = InventoryStatus.from(this.quantity, this.optimalQuantity);
    }

    /**
     * 수량 변경 후 상태와 업데이트 시각을 동기화한다.
     *
     * <p>서비스 계층에서 수량을 갱신한 뒤 반드시 호출한다.
     * 내부적으로 {@link #updateStatusNow()}를 호출하고 {@code updateDate}를 현재 시각으로 갱신한다.</p>
     */
    public final void touchAfterQuantityChange() {
        this.updateStatusNow();
        this.updateDate = LocalDateTime.now();
    }

    /**
     * 영속화 직전 훅.
     *
     * <p>{@code updateDate}가 비어 있으면 현재 시각으로 채우고,
     * 상태가 비어 있으면 {@link #updateStatusNow()}로 초기 상태를 확정한다.</p>
     */
    @PrePersist
    protected void onCreate() {
        if (this.updateDate == null) this.updateDate = LocalDateTime.now();
        if (this.status == null) this.updateStatusNow();
    }

    /**
     * 업데이트 직전 훅.
     *
     * <p>{@code updateDate}를 현재 시각으로 갱신하고
     * 상태가 비어 있으면 {@link #updateStatusNow()}로 보정한다.</p>
     */
    @PreUpdate
    protected void onUpdate() {
        this.updateDate = LocalDateTime.now();
        if (this.status == null) this.updateStatusNow();
    }
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\inventory\entity\InventoryStatus.java ---

package com.boot.ict05_final_user.domain.inventory.entity;

import java.math.BigDecimal;

/**
 * 재료의 재고상태 Enum
 *
 * <p>재료의 재고상태를 정의하며, 각 항목은 한글 설명(description)을 가진다.</p>
 *
 * <p>재료의 재고상태:</p>
 * <ul>
 *     <li>SUFFICIENT: 충분</li>
 *     <li>LOW: 부족</li>
 *     <li>SHORTAGE: 품절</li>
 * </ul>
 */
public enum InventoryStatus {
    /** 충분 : 정정 재고 이상 */
    SUFFICIENT("충분"),

    /** 부족 : 적정 재고 미만 */
    LOW("부족"),

    /** 품절 : 재고 0이하 */
    SHORTAGE("품절");

    /** 한글 설명 */
    private final String description;

    /**
     * 생성자
     *
     * @param description 각 재료의 재고상태의 한글 설명
     */
    InventoryStatus(String description) {
        this.description = description;
    }

    /**
     * 재료의 재고상태 한글 설명을 반환한다.
     *
     * @return 재료의 재고상태 설명
     */
    public String getDescription() {
        return description;
    }

    /**
     * 상태 계산. null-safe.
     *
     * <ul>
     *   <li>quantity ≤ 0 → SHORTAGE</li>
     *   <li>optimal == null → quantity &gt; 0이면 SUFFICIENT</li>
     *   <li>quantity &lt; optimal → LOW</li>
     *   <li>그 외 SUFFICIENT</li>
     * </ul>
     */
    public static InventoryStatus from(BigDecimal quantity, BigDecimal optimalQuantity) {
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) return SHORTAGE;
        if (optimalQuantity == null) return SUFFICIENT;
        return quantity.compareTo(optimalQuantity) < 0 ? LOW : SUFFICIENT;
    }

    /** backward-compat alias */
    public static InventoryStatus calculate(BigDecimal quantity, BigDecimal optimalQuantity) {
        return from(quantity, optimalQuantity);
    }
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\inventory\entity\Material.java ---

package com.boot.ict05_final_user.domain.inventory.entity;

import com.boot.ict05_final_user.domain.material.dto.MaterialModifyFormDTO;
import jakarta.persistence.*;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.Comment;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.DynamicUpdate;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 재료(Material) 엔티티 클래스
 *
 * <p>본 클래스는 재료 테이블과 매핑되며,
 * 재료의 재료코드, 재료명, 카테고리, 단위, 공급업체명, 재료보관온도,  재료상태 등의 정보를 포함합니다.</p>
 *
 * <p>엔티티는 생성, 조회, 수정 기능을 지원하며,
 * {@link #updateMaterial(MaterialModifyFormDTO)} 메서드를 통해 상태를 변경할 수 있습니다.</p>
 *
 * @author 김주연
 * @since 2025-10-15
 */

@Entity
@Table(name = "material")
@DynamicUpdate
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Material {

    /** 재료 고유 ID */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "material_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    @Comment("재료 시퀀스")
    private Long id;

    /** 재료 코드 */
    @Column(name = "material_code", length = 30, nullable = false, unique = true,
            columnDefinition = "VARCHAR(30)")
    @Comment("재료 코드 - 등록시 카테고리 기준으로 생성")
    private String code;

    /** 재료명 */
    @Column(name = "material_name", length = 100, nullable = false,
            columnDefinition = "VARCHAR(100)")
    @Comment("재료명")
    private String name;

    /** 재료 카테고리 */
    @Enumerated(EnumType.STRING)
    @Column(name = "material_category", length = 50, nullable = false,
            columnDefinition = "ENUM('BASE','SIDE','SAUCE','TOPPING','BEVERAGE','PACKAGE','ETC')")
    @Comment("재료 카테고리")
    private MaterialCategory materialCategory;

    /** 기본 단위 (소진 단위) */
    @Column(name = "material_base_unit", length = 20, nullable = false,
            columnDefinition = "VARCHAR(20)")
    @Comment("기본 단위(소진 단위)")
    private String baseUnit;

    /** 판매 단위 */
    @Column(name = "material_sales_unit", length = 20, nullable = false,
            columnDefinition = "VARCHAR(20)")
    @Comment("판매 단위")
    private String salesUnit;

    /** 변환비율(판매 단위 → 기본단위) */
    @Column(name = "material_conversion_rate", nullable = false,
            columnDefinition = "INT default 1000")
    @Comment("변환비율(판매 단위/기본 단위)")
    private Integer conversionRate;

    /** 공급업체명 */
    @Column(name = "material_supplier", length = 100,
            columnDefinition = "VARCHAR(100)")
    @Comment("재료 공급업체명")
    private String supplier;

    /** 재료 보관온도 */
    @Enumerated(EnumType.STRING)
    @Column(name = "material_temperature")
    @Comment("재료 보관온도")
    private MaterialTemperature materialTemperature;

    /** 재료 상태 */
    @Enumerated(EnumType.STRING)
    @Column(name = "material_status", nullable = false)
    @Comment("재료 상태 (USE/STOP)")
    private MaterialStatus materialStatus;

    /** 등록일시 */
    @CreationTimestamp
    @Column(name = "material_reg_date",
            columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP")
    @Comment("등록일시")
    private LocalDateTime regDate;

    /** 수정일시 */
    @UpdateTimestamp
    @Column(name = "material_modify_date",
            columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
    @Comment("수정일시")
    private LocalDateTime modifyDate;

    /** 본사 기준 적정 재고 수량 */
    @Setter
    @Builder.Default
    @Column(name = "material_optimal_quantity", precision = 15, scale = 3,
            columnDefinition = "DECIMAL(15,3) DEFAULT 0")
    @Comment("본사 기준 적정 재고 수량")
    private BigDecimal optimalQuantity = BigDecimal.ZERO;

    /**
     * 재료 정보를 수정하는 메서드
     *
     * <p>입력된 {@link MaterialModifyFormDTO} 객체의 데이터를 기준으로
     * 공지사항 엔티티의 상태를 변경합니다. 수정 시 작성일자는 현재 시간으로 갱신됩니다.</p>
     *
     * @param dto 수정할 공지사항 정보를 담고 있는 DTO 객체
     */
    public void updateMaterial(MaterialModifyFormDTO dto) {
        this.name                   = dto.getName();
        this.materialCategory       = dto.getMaterialCategory();
        this.baseUnit               = dto.getBaseUnit();
        this.salesUnit              = dto.getSalesUnit();
        this.conversionRate         = dto.getConversionRate();
        this.supplier               = dto.getSupplier();
        this.materialTemperature    = dto.getMaterialTemperature();
        this.materialStatus         = dto.getMaterialStatus();
        this.optimalQuantity        = dto.getOptimalQuantity();
        this.modifyDate             = LocalDateTime.now();
    }
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\inventory\entity\MaterialCategory.java ---

package com.boot.ict05_final_user.domain.inventory.entity;

/**
 * 재료 카테고리 Enum
 *
 * <p>재료의 카테고리를 정의하며, 각 항목은 한글 설명(description)을 가진다.</p>
 *
 * <p>주요 카테고리:</p>
 * <ul>
 *     <li>BASE: 기본재료</li>
 *     <li>SIDE: 사이드</li>
 *     <li>SAUCE: 소스</li>
 *     <li>TOPPING: 토핑</li>
 *     <li>BEVERAGE: 음료</li>
 *     <li>PACKAGE: 패키지</li>
 *     <li>ETC: 기타</li>
 * </ul>
 */
public enum MaterialCategory {
    /** 기본재료 */
    BASE("기본재료", "BAS"),

    /** 사이드 */
    SIDE("사이드", "SID"),

    /** 소스 */
    SAUCE("소스", "SAU"),
    
    /** 토핑 */
    TOPPING("토핑", "TOP"),
    
    /** 음료 */
    BEVERAGE("음료", "BEV"),
    
    /** 패키지 */
    PACKAGE("패키지", "PAC"),

    /** 기타 */
    ETC("기타", "ETC");

    /** 코드 접두어 (영문 3자리) */
    private final String codePrefix;

    /** 한글 설명 */
    private final String description;

    /**
     * 생성자
     *
     * @param description 각 카테고리의 한글 설명
     * @param codePrefix  각 카테고리의 코드 접두어
     */
    MaterialCategory(String description, String codePrefix) {
        this.description = description;
        this.codePrefix = codePrefix;
    }

    /**
     * 카테고리 한글 설명을 반환한다.
     *
     * @return 카테고리 설명
     */
    public String getDescription() {
        return description;
    }

    /**
     * 코드의 접두어를 반환한다.
     *
     * @return 코드접두어
     */
    public String getCodePrefix() {return codePrefix;}
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\inventory\entity\MaterialStatus.java ---

package com.boot.ict05_final_user.domain.inventory.entity;

/**
 * 재료의 상태 Enum
 *
 * <p>재료의 상태을 정의하며, 각 항목은 한글 설명(description)을 가진다.</p>
 *
 * <p>재료의 상태:</p>
 * <ul>
 *     <li>USE: 사용중</li>
 *     <li>STOP : 사용중단</li>
 * </ul>
 */
public enum MaterialStatus {
    /** 사용중 */
    USE("사용중"),

    /** 사용중단 */
    STOP("사용중단");

    /** 한글 설명 */
    private final String description;

    /**
     * 생성자
     *
     * @param description 각 재료의 상태의 한글 설명
     */
    MaterialStatus(String description) {
        this.description = description;
    }

    /**
     * 재료의 상태 한글 설명을 반환한다.
     *
     * @return 재료의 상태 설명
     */
    public String getDescription() {
        return description;
    }
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\inventory\entity\MaterialTemperature.java ---

package com.boot.ict05_final_user.domain.inventory.entity;

/**
 * 재료 보관방법 Enum
 *
 * <p>재료의 보관방법을 정의하며, 각 항목은 한글 설명(description)을 가진다.</p>
 *
 * <p>재료 보관방법:</p>
 * <ul>
 *     <li>TEMPERATURE: 상온보관</li>
 *     <li>REFRIGERATE : 냉장보관</li>
 *     <li>FREEZE : 냉동보관</li>
 * </ul>
 */
public enum MaterialTemperature {

    /** 상온보관 */
    TEMPERATURE("상온"),

    /** 냉장보관 */
    REFRIGERATE("냉장"),

    /** 냉동보관 */
    FREEZE("냉동");

    /** 한글 설명 */
    private final String description;

    /**
     * 생성자
     *
     * @param description 각 재료 보관방법의 한글 설명
     */
    MaterialTemperature(String description) {
        this.description = description;
    }

    /**
     * 재료 보관방법 한글 설명을 반환한다.
     *
     * @return 재료 보관방법 설명
     */
    public String getDescription() {
        return description;
    }
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\inventory\entity\StoreInventory.java ---

package com.boot.ict05_final_user.domain.inventory.entity;

import com.boot.ict05_final_user.domain.store.entity.Store;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Comment;

/**
 * 가맹점 재고(StoreInventory) 엔티티
 *
 * <p>각 매장의 현재 재고, 적정 수량, 상태를 관리한다.</p>
 * <p>본사 Inventory와 StoreMaterial을 기반으로 재고를 추적한다.</p>
 */
@Entity
@Table(name = "store_inventory",
        uniqueConstraints = @UniqueConstraint(name = "uq_store_inv",
                columnNames = {"store_id_fk", "store_material_id_fk"}))

@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@SuperBuilder
@Getter
@Comment("가맹점 재고")
public class StoreInventory extends InventoryBase {

    /** 가맹점 재고 시퀀스 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "store_inventory_id", columnDefinition = "BIGINT UNSIGNED")
    @Comment("가맹점 재고 시퀀스")
    private Long id;

    /** 가맹점 (FK: store.store_id) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id_fk", nullable = false,
            foreignKey = @ForeignKey(name = "fk_si_store"))
    private Store store;

    /** 가맹점 재료 (FK: store_material.store_material_id) */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_material_id_fk", nullable = false,
            foreignKey = @ForeignKey(name = "fk_si_store_material"))
    private StoreMaterial storeMaterial;
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\inventory\entity\StoreMaterial.java ---

package com.boot.ict05_final_user.domain.inventory.entity;

import com.boot.ict05_final_user.domain.store.entity.Store;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 가맹점 재료(StoreMaterial) 엔티티
 *
 * <p>각 가맹점의 재료 정보를 관리한다.</p>
 * <ul>
 *   <li>본사 공급 재료(isHqMaterial = true) → material_id_fk 존재</li>
 *   <li>가맹점 자체 등록 재료(isHqMaterial = false) → material_id_fk = NULL</li>
 * </ul>
 * <p>
 * 본사 재료일 경우, 본사의 판매단위(salesUnit)를 가맹점 기준 단위로 사용한다.
 * 자체 등록 재료일 경우, 가맹점의 기본 단위를 직접 입력한다.
 * </p>
 */
@Entity
@Table(
        name = "store_material",
        uniqueConstraints = @UniqueConstraint(columnNames = {"store_id_fk", "store_material_code"})
)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreMaterial {

    /** 가맹점 재료 고유 ID */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "store_material_id", columnDefinition = "BIGINT UNSIGNED")
    @Comment("가맹점 재료 시퀀스")
    private Long id;

    /** 가맹점 (FK: store.store_id) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "store_id_fk",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_sm_store"),
            columnDefinition = "BIGINT UNSIGNED"
    )
    @Comment("매장 시퀀스 (FK)")
    private Store store;

    /** 본사 재료 (FK: material.material_id) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "material_id_fk",
            foreignKey = @ForeignKey(name = "fk_sm_material"),
            columnDefinition = "BIGINT UNSIGNED"
    )
    @Comment("본사 재료 (FK)")
    private Material material;

    /** 가맹점 재료 코드 (점포별 고유) */
    @Column(name = "store_material_code", length = 30, nullable = false,
            columnDefinition = "VARCHAR(30)")
    @Comment("가맹점 재료 코드(점포별 고유)")
    private String code;

    /** 가맹점 재료명 */
    @Column(name = "store_material_name", length = 100, nullable = false,
            columnDefinition = "VARCHAR(100)")
    @Comment("가맹점 재료명")
    private String name;

    /** 카테고리 */
    @Column(name = "store_material_category", length = 50,
            columnDefinition = "VARCHAR(50)")
    @Comment("가맹점 재료 카테고리")
    private String category;

    /** 기본 단위 (소진 단위, 가맹점 기준) */
    @Column(name = "store_material_base_unit", length = 20,
            columnDefinition = "VARCHAR(20)")
    @Comment("기본 단위(가맹점 기준)")
    private String baseUnit;

    /** 판매 단위 (본사 기준 단위, 본사 재료일 경우 참조됨) */
    @Column(name = "store_material_sales_unit", length = 20,
            columnDefinition = "VARCHAR(20)")
    @Comment("판매 단위(본사 기준)")
    private String salesUnit;

    /** 공급업체명 */
    @Column(name = "store_material_supplier", length = 100,
            columnDefinition = "VARCHAR(100)")
    @Comment("가맹점 재료 공급업체명")
    private String supplier;

    /** 보관온도 */
    @Enumerated(EnumType.STRING)
    @Column(name = "store_material_temperature",
            columnDefinition = "ENUM('TEMPERATURE','REFRIGERATE','FREEZE')")
    @Comment("보관온도")
    private MaterialTemperature temperature;

    /** 재료 상태 */
    @Enumerated(EnumType.STRING)
    @Column(name = "store_material_status", nullable = false,
            columnDefinition = "ENUM('USE','STOP') DEFAULT 'USE'")
    @Comment("재료 상태")
    private MaterialStatus status;

    /** 현재 수량 */
    @Column(name = "store_material_quantity", nullable = false, precision = 15, scale = 3,
            columnDefinition = "DECIMAL(15,3) DEFAULT 0")
    @Comment("현재 수량")
    private BigDecimal quantity;

    /** 적정 수량 */
    @Column(name = "store_material_optimal_quantity", precision = 15, scale = 3,
            columnDefinition = "DECIMAL(15,3)")
    @Comment("적정 수량")
    private BigDecimal optimalQuantity;

    /** 매입가 */
    @Column(name = "store_material_purchase_price",
            columnDefinition = "BIGINT")
    @Comment("매입가")
    private BigDecimal purchasePrice;

    /** 판매가 */
    @Column(name = "store_material_selling_price",
            columnDefinition = "BIGINT")
    @Comment("판매가")
    private BigDecimal sellingPrice;

    /** 유통기한 */
    @Column(name = "store_material_expiration_date",
            columnDefinition = "DATE")
    @Comment("유통기한")
    private LocalDate expirationDate;

    /** 본사 재료 여부 (1=본사, 0=가맹점 자체 등록) */
    @Column(name = "store_material_is_hq_material", nullable = false,
            columnDefinition = "TINYINT(1) DEFAULT 0")
    @Comment("본사 재료 여부")
    private boolean isHqMaterial;

    /** 등록일 */
    @CreationTimestamp
    @Column(name = "store_material_reg_date", nullable = false,
            columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP")
    @Comment("등록일")
    private LocalDateTime regDate;

    /** 수정일 */
    @UpdateTimestamp
    @Column(name = "store_material_modify_date",
            columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
    @Comment("수정일")
    private LocalDateTime modifyDate;
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\inventory\entity\UnitPriceType.java ---

package com.boot.ict05_final_user.domain.inventory.entity;

/**
 * 단가 구분 Enum
 *
 * <p>재료의 단가 구분을 정의하며, 각 항목은 한글 설명(description)을 가진다.</p>
 *
 * <p>주요 카테고리:</p>
 * <ul>
 *     <li>PURCHASE: 매입가</li>
 *     <li>SELLING: 판매가</li>
 * </ul>
 */
public enum UnitPriceType {
    /** 매입가 */
    PURCHASE("매입가"),

    /** 판매가 */
    SELLING("판매가");

    /** 한글 설명 */
    private final String description;

    /**
     * 생성자
     *
     * @param description 각 단가 구분의 한글 설명
     */
    UnitPriceType(String description) { this.description = description; }

    /**
     * 단가 구분 한글 설명을 반환한다.
     *
     * @return 단가 구분 설명
     */
    public String getDescription() {
        return description;
    }
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\menu\entity\MenuCategory.java ---

package com.boot.ict05_final_user.domain.menu.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity     // DB 테이블이랑 연결
@Table(name = "menu_category")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder    // 객체를 만드는 방법을 제공
public class MenuCategory {

    @Id     // PK
    @GeneratedValue(strategy = GenerationType.IDENTITY)     // id 숫자를 자동 증가
    @Column(name = "menu_category_id")
    private Long menuCategoryId;

    /** 상위 카테고리 (대중소 구조 지원) */
    @ManyToOne(fetch = FetchType.LAZY)      // 1개의 자식 카테고리(소)는 1개의 부모 카테고리(상위)를 참조 / LAZY(지연로딩): 진짜 필요할 때만 DB에서 부모 가져옴
    @JoinColumn(name = "menu_category_parent_id")
    private MenuCategory menuCategoryParentId;

    /** 카테고리명 */
    @Column(name = "menu_category_name")
    private String menuCategoryName;

    /** 단계 구분(대=1, 중=2, 소=3) */
    @Column(name = "menu_category_level")
    private Short menuCategoryLevel;


}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\menu\entity\MenuRecipe.java ---

package com.boot.ict05_final_user.domain.menu.entity;

import com.boot.ict05_final_user.domain.material.entity.Material;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuRecipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "menu_recipe_id")
    private Long menuRecipeId;

    @Column(name = "recipe_item_name", length = 100, nullable = false)
    private String recipeItemName;   // 항목명

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "menu_id_fk", nullable = false)
    private Menu menu;

    @ManyToOne(optional = true, fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id_fk", nullable = true)
    private Material material;

    @Column(name = "recipe_qty", precision = 12, scale = 3, nullable = false)
    private BigDecimal recipeQty;

    @Column(name = "recipe_unit", length = 20, nullable = false)
    @Enumerated(EnumType.STRING)
    private RecipeUnit recipeUnit;

    @Enumerated(EnumType.STRING)
    @Column(name = "recipe_role", nullable = false)
    private RecipeRole recipeRole; // MAIN / SAUCE / TOPPING

    @Column(name = "recipe_sort", nullable = false)
    private Integer recipeSort;

    public enum RecipeRole { MAIN, SAUCE } // TOPPING은 MenuRecipe에 없음
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\menu\entity\MenuShow.java ---

package com.boot.ict05_final_user.domain.menu.entity;

/**
 * 메뉴 상태 Enum
 *
 * <p>메뉴 상태 분류를 정의하며, 각 항목은 한글 설명(description)을 가진다.</p>
 *
 * <p>주요 상태:</p>
 * <ul>
 *     <li>GO: 판매중</li>
 *     <li>STOP: 판매중지</li>
 * </ul>
 */
public enum MenuShow {

    SHOW("판매중"),

    HIDE("판매중지");

    /** 한글 설명 */
    private final String description;

    /**
     * 생성자
     *
     * @param description 각 상태의 한글 설명
     */
    MenuShow(String description)  { this.description = description; } // SHOW, HIDE

    /**
     *  메뉴 한글 설명을 반환한다
     *
     * @return 카테고리 설명
     * */
    public String getDescription() {
        return description;
    }
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\menu\entity\MenuUsageMaterialLog.java ---

package com.boot.ict05_final_user.domain.menu.entity;

import com.boot.ict05_final_user.domain.material.entity.StoreMaterial;
import com.boot.ict05_final_user.domain.order.entity.CustomerOrder;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 메뉴 재료 소진 기록(menu_usage_material_log)
 *
 * 주문 발생 시 어떤 메뉴 때문에 어떤 매장 재료가 얼마나 소진됐는지 기록
 */
@Entity
@Table(name = "menu_usage_material_log")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuUsageMaterialLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "menu_usage_material_log_id",
            columnDefinition = "BIGINT UNSIGNED COMMENT '재료 소진 기록 시퀀스'")
    private Long id;

    /** 주문 시퀀스 (FK: customer_order.customer_order_id) */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "customer_order_id_fk",
            nullable = false,
            columnDefinition = "BIGINT UNSIGNED COMMENT '주문 시퀀스 (FK)'"
    )
    private CustomerOrder customerOrderFk;

    /** 메뉴 시퀀스 (FK: menu.menu_id) */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "menu_id_fk",
            nullable = false,
            columnDefinition = "BIGINT UNSIGNED COMMENT '메뉴 시퀀스 (FK)'"
    )
    private Menu menuFk;

    /** 매장 재료 시퀀스 (FK: store_material.store_material_id) */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "store_material_id_fk",
            nullable = false,
            columnDefinition = "BIGINT UNSIGNED COMMENT '매장 재료 시퀀스 (FK)'"
    )
    private StoreMaterial storeMaterialFk;

    @Column(name = "menu_usage_material_log_count",
            nullable = false,
            precision = 15,
            scale = 3,
            columnDefinition = "DECIMAL(15,3) COMMENT '재료 소진 수량'")
    private BigDecimal count;

    @Column(name = "menu_usage_material_log_unit",
            length = 20,
            nullable = false,
            columnDefinition = "VARCHAR(20) COMMENT '재료 소진 단위'")
    private String unit;

    @CreationTimestamp
    @Column(name = "menu_usage_material_log_date",
            nullable = false,
            columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '재료 소진 기록 일자'")
    private LocalDateTime logDate;

    @Column(name = "menu_usage_material_log_memo",
            columnDefinition = "VARCHAR(255) COMMENT '비고'")
    private String memo;
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\menu\entity\RecipeUnit.java ---

package com.boot.ict05_final_user.domain.menu.entity;

public enum RecipeUnit {

    G("g"), ML("ml"), EA("개"), SHEET("장");
    private final String label;
    RecipeUnit(String label) { this.label = label; } // G, ML, EA, SHEET
    public String getLabel() { return label; }
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\menu\entity\SoldOutStatus.java ---

package com.boot.ict05_final_user.domain.menu.entity;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "메뉴/재료 판매 상태")
public enum SoldOutStatus {

    @Schema(description = "정상 판매중")
    ON_SALE("판매중", true),

    @Schema(description = "품절(판매 불가)")
    SOLD_OUT("품절", false);

    private final String label;       // 한글 라벨
    private final boolean sellable;   // 판매 가능 여부

    SoldOutStatus(String label, boolean sellable) { this.label = label; this.sellable = sellable; }

    public String getLabel() { return label; }
    public boolean isSellable() { return sellable; }

    /** 재고 수량으로 상태 추론 (기준: 재고 1 이상 = 판매중, 0 이하 = 품절) */
    public static SoldOutStatus fromQty(int qty) {
        return qty > 0 ? ON_SALE : SOLD_OUT;
    }
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\notice\entity\Notice.java ---

package com.boot.ict05_final_user.domain.notice.entity;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notice {

    /** 공지사항 고유 ID */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notice_id")
    private Long id;

    /** 작성자(회원) FK */
    @Column(name = "member_id_fk")
    private Long memberIdFk;

    /** 공지사항 카테고리 */
    @Enumerated(EnumType.STRING)
    @Column(name = "notice_category")
    private NoticeCategory noticeCategory;

    /** 공지사항 우선순위 */
    @Enumerated(EnumType.STRING)
    @Column(name = "notice_priority")
    private NoticePriority noticePriority;

    /** 공지사항 상태  */
    @Enumerated(EnumType.STRING)
    @Column(name = "notice_status")
    private NoticeStatus noticeStatus;

    /** 공지사항 노출 여부 */
    @Column(name = "is_show")
    private Boolean isShow;

    /** 작성자 이름 */
    @Column(name = "writer")
    private String writer;

    /** 공지사항 제목 */
    @Column(name = "notice_title")
    private String title;

    /** 공지사항 본문 내용 */
    @Column(name = "notice_content")
    private String body;

    /** 작성일자 */
    @Schema(type="string", format="date-time")
    @Column(name = "notice_reg_date")
    private LocalDateTime registeredAt;

    /** 조회수 */
    @Column(name = "notice_count")
    private Integer noticeCount;

    /** 확인 여부 (TINYINT(1) → Boolean) */
    @Column(name = "notice_confirmed")
    private Boolean noticeConfirmed;

    /**
     * 조회수를 1 증가시키는 메서드
     */
    public void incrementNoticeCount() {
        if (this.noticeCount == null) {
            this.noticeCount = 0;
        }
        this.noticeCount++;
    }
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\notice\entity\NoticeAttachment.java ---

package com.boot.ict05_final_user.domain.notice.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
public class NoticeAttachment {

    /**
     * 첨부파일 고유 ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 첨부파일이 연결된 공지사항 ID
     */
    private Long noticeId;

    /**
     * 첨부파일 URL
     */
    private String url;
    /**
     * 원본 파일명
     */
    private String originalFilename;
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\notice\entity\NoticeCategory.java ---

package com.boot.ict05_final_user.domain.notice.entity;

public enum NoticeCategory {

    /** 일반 공지 */
    NORMAL("일반"),

    /** 시스템 관련 공지 */
    SYSTEM("시스템"),

    /** 이벤트 공지 */
    EVENT("이벤트"),

    /** 정책/공지사항 */
    POLICY("공지");

    /** 한글 설명 */
    private final String description;

    /**
     * 생성자
     *
     * @param description 각 카테고리의 한글 설명
     */
    NoticeCategory(String description) {
        this.description = description;
    }

    /**
     * 카테고리 한글 설명을 반환한다.
     *
     * @return 카테고리 설명
     */
    public String getDescription() {
        return description;
    }
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\notice\entity\NoticePriority.java ---

package com.boot.ict05_final_user.domain.notice.entity;

public enum NoticePriority {

    /** 일반 우선순위 */
    NORMAL("일반"),

    /** 중요 우선순위 */
    IMPORTANT("중요"),

    /** 긴급 우선순위 */
    EMERGENCY("긴급");

    /** 한글 설명 */
    private final String description;

    /**
     * 생성자
     *
     * @param description 각 우선순위의 한글 설명
     */
    NoticePriority(String description) {
        this.description = description;
    }

    /**
     * 우선순위 한글 설명을 반환한다.
     *
     * @return 우선순위 설명
     */
    public String getDescription() {
        return description;
    }
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\notice\entity\NoticeStatus.java ---

package com.boot.ict05_final_user.domain.notice.entity;

public enum NoticeStatus {

    /** 활성 상태 */
    ACTIVE("활성"),

    /** 비활성 상태 */
    INACTIVE("비활성"),

    /** 삭제 상태 */
    DELETED("삭제");

    /** 한글 설명(= DB ENUM 저장값) */
    private final String description;

    /**
     * 생성자
     *
     * @param description 각 상태의 한글 설명
     */
    NoticeStatus(String description) {
        this.description = description;
    }

    /**
     * 상태의 한글 설명을 반환한다.
     *
     * @return 상태 설명
     */
    public String getDescription() {
        return description;
    }
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\order\entity\CustomerOrderDetail.java ---

package com.boot.ict05_final_user.domain.order.entity;

import com.boot.ict05_final_user.domain.menu.entity.Menu;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.math.BigDecimal;

/**
 * 주문 상세(CustomerOrderDetail) 엔티티
 *
 * <p>주문에 포함된 개별 메뉴/수량/단가/금액 정보를 담는다.</p>
 */
@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "customer_order_detail")
public class CustomerOrderDetail {

    /** 주문 상세 시퀀스 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "customer_order_detail_id")
    private Long id;

    /** 주문(FK) */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_order_id_fk", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @Setter
    private CustomerOrder order;

    /** 메뉴 시퀀스(FK) */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "menu_id_fk", nullable = false)
    private Menu menuIdFk;

    /** 주문 수량 */
    @Column(name = "customer_order_detail_quantity", nullable = false)
    private Integer quantity;

    /** 단가 (당시 메뉴 가격 스냅샷) */
    @Column(name = "customer_order_detail_unit_price", precision = 15, scale = 2, nullable = false)
    private BigDecimal unitPrice;

    /** 주문 금액(해당 라인 총액 = 단가 × 수량) */
    @Column(name = "customer_order_detail_total", precision = 15, scale = 2, nullable = false)
    private BigDecimal lineTotal;

    /** 단가 × 수량 자동 계산 */
    @PrePersist
    @PreUpdate
    void calculateLineTotal() {
        if (quantity == null) quantity = 1;
        if (unitPrice == null) unitPrice = BigDecimal.ZERO;
        this.lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
    }
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\order\entity\OrderStatus.java ---

package com.boot.ict05_final_user.domain.order.entity;

/** 주문 상태 (DB에는 한글 값 저장) */
public enum OrderStatus {
    PENDING("대기"),
    PAID("결제완료"),
    PREPARING("준비중"),
    COMPLETED("완료"),
    CANCELED("취소"),
    READY("픽업대기"),
    REFUNDED("환불");

    private final String dbValue;

    OrderStatus(String dbValue) { this.dbValue = dbValue; }
    public String getDbValue() { return dbValue; }

    public static OrderStatus from(String dbValue) {
        for (OrderStatus v : values()) {
            if (v.dbValue.equals(dbValue)) return v;
        }
        throw new IllegalArgumentException("Unknown OrderStatus dbValue=" + dbValue);
    }
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\order\entity\OrderType.java ---

package com.boot.ict05_final_user.domain.order.entity;

/** 주문 형태  */
public enum OrderType {
    VISIT("VISIT", "방문"),
    TAKEOUT("TAKEOUT", "포장"),
    DELIVERY("DELIVERY", "배달");

    private final String dbValue;
    private final String label;
    OrderType(String dbValue, String label) { this.dbValue = dbValue; this.label = label; }
    public String getDbValue() { return dbValue; }
    public String getLabel()   { return label; }

    public static OrderType from(String dbValue) {
        for (OrderType v : values()) if (v.dbValue.equals(dbValue)) return v;
        throw new IllegalArgumentException("Unknown OrderType dbValue=" + dbValue);
    }
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\purchaseOrder\entity\PurchaseOrder.java ---

package com.boot.ict05_final_user.domain.purchaseOrder.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * 가맹점 발주 엔티티 (Purchase Order) 
 * DB 테이블명: purchase_order
 */
@Entity
@Table(name = "purchase_order")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "purchase_order_id", columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "purchase_order_code", length = 32, nullable = false, unique = true)
    private String orderCode;

    /** Material에서 가져오는 대표 품목명 */
    @Column(name = "purchase_order_main_item_name", length = 100)
    private String mainItemName;

    /** 한 발주 내 품목 수 */
    @Column(name = "purchase_order_item_count")
    private Integer itemCount;

    /** 발주 주문일 */
    @Column(name = "purchase_order_date", nullable = false)
    private LocalDate orderDate;

    /** 총액 */
    @Column(name = "purchase_order_total_price", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalPrice = BigDecimal.ZERO;

    /** 발주 비고 */
    @Column(name = "purchase_order_remark", columnDefinition = "TEXT")
    private String remark;

    /** Material에서 가져오는 공급업체명 */
    @Column(name = "purchase_order_supplier", length = 100, nullable = false)
    private String supplier;

    @Enumerated(EnumType.STRING)
    @Column(name = "purchase_order_status")
    private PurchaseOrderStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "purchase_order_priority")
    private PurchaseOrderPriority priority;

    @Column(name = "purchase_order_delivery_date")
    private LocalDate deliveryDate;

    @Column(name = "purchase_order_actual_delivery_date")
    private LocalDate actualDeliveryDate;

    /** 발주 상세 항목들 */
    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseOrderDetail> details;
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\purchaseOrder\entity\PurchaseOrderDetail.java ---

package com.boot.ict05_final_user.domain.purchaseOrder.entity;

import com.boot.ict05_final_user.domain.material.entity.StoreMaterial;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * 가맹점 발주 상세 엔티티 (Purchase Order Detail)
 * DB 테이블명: purchase_order_detail
 */
@Entity
@Table(name = "purchase_order_detail")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseOrderDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "purchase_order_detail_id")
    private Long id;

    /** 발주 헤더 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_order_id_fk", nullable = false)
    private PurchaseOrder purchaseOrder;

    /** 발주 품목 Material */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id_fk", nullable = false)
    private StoreMaterial material;

    /** 단가 : 등록 시 Material.unitPrice 사용 */
    @Column(name = "purchase_order_detail_unit_price", precision = 12, scale = 2, nullable = false)
    private BigDecimal unitPrice;

    /** 단위 : Material.unit 사용 (DTO에서만 필요할 수 있음) */
    @Transient
    private String unit;

    /** 수량 : 등록 시 입력값 */
    @Column(name = "purchase_order_detail_count", nullable = false)
    private Integer count;

    /** 총액 = 단가 * 수량 */
    @Column(name = "purchase_order_detail_total_price", precision = 12, scale = 2, nullable = false)
    private BigDecimal totalPrice;
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\purchaseOrder\entity\PurchaseOrderPriority.java ---

package com.boot.ict05_final_user.domain.purchaseOrder.entity;

public enum PurchaseOrderPriority {

    /** 일반 */
    NORMAL("일반"),

    /** 우선 */
    URGENT("우선");

    /** 한글 설명 */
    private final String description;

    /**
     * 생성자
     *
     * @param description 각 카테고리의 한글 설명
     */
    PurchaseOrderPriority(String description) { this.description = description; } // NORMAL, URGENT

    /**
     * 카테고리 한글 설명을 반환한다.
     *
     * @return 카테고리 설명
     */
    public String getDescription() { return description; }
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\purchaseOrder\entity\PurchaseOrderStatus.java ---

package com.boot.ict05_final_user.domain.purchaseOrder.entity;

/** 발주 상태 */
public enum PurchaseOrderStatus {

    /** 대기중 */
    PENDING("대기중"),

    /** 접수됨 */
    RECEIVED("접수됨"),

    /** 배송중 */
    SHIPPING("배송중"),

    /** 검수완료 */
    DELIVERED("검수완료"),

    /** 주문(접수) 취소됨 */
    CANCELED("취소됨");

    /** 한글 설명 */
    private final String description;

    /**
     * 생성자
     *
     * @param description 각 카테고리의 한글 설명
     */
    PurchaseOrderStatus(String description) { this.description = description; } // PENDING, RECEIVED, SHIPPING, DELIVERED, CANCELED

    /**
     * 카테고리 한글 설명을 반환한다.
     *
     * @return 카테고리 설명
     */
    public String getDescription() { return description; }
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\staff\entity\Attendance.java ---

package com.boot.ict05_final_user.domain.staff.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attendance {

    /** 근무 시퀀스 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attendance_id", nullable = false, updatable = false)
    private Long id; // INT UNSIGNED → Long 매핑

    /** 직원 프로필 (근태는 직원에 종속됨) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id_fk", nullable = false)
    private StaffProfile staffProfile;

    /** 근무 일자 */
    @Column(name = "attendance_work_date", nullable = false)
    private LocalDate workDate;

    /** 출근 시간 */
    @Column(name = "attendance_check_in")
    private LocalDateTime checkIn;

    /** 퇴근 시간 */
    @Column(name = "attendance_check_out")
    private LocalDateTime checkOut;

    /** 근태 상태 */
    @Enumerated(EnumType.STRING)
    @Column(name = "attendance_status", nullable = false, length = 20)
    private AttendanceStatus status;

    /** 실제 근무 시간 */
    @Column(name = "attendance_work_hours", nullable = false, precision = 6, scale = 2)
    private BigDecimal workHours;

    /** 비고/사유 */
    @Column(name = "attendance_memo", length = 255)
    private String memo;

    /** 처음 생성된 시각 */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** 마지막으로 수정된 시각 */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\staff\entity\AttendanceStatus.java ---

package com.boot.ict05_final_user.domain.staff.entity;


import java.util.Arrays;

/** 직원 상태 (DB에는 한글 값 저장) */
public enum AttendanceStatus {
    NORMAL("normal", "정상"),
    LATE("late", "지각"),
    EARLY_LEAVE("early_leave", "조퇴"),
    ABSENT("absent", "결근"),
    VACATION("vacation", "휴가"),
    HOLIDAY("holiday", "휴일");

    private final String code;   // DB 저장값
    private final String label;  // 한글 라벨

    AttendanceStatus(String code, String label) {
        this.code = code;
        this.label = label;
    }

    public String getCode() {
        return code;
    }

    public String getLabel() {
        return label;
    }

    public static AttendanceStatus fromCode(String code) {
        return Arrays.stream(values())
                .filter(v -> v.code.equalsIgnoreCase(code))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown AttendanceStatus code: " + code));
    }

    public static AttendanceStatus fromLabel(String label) {
        return Arrays.stream(values())
                .filter(v -> v.label.equals(label))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown AttendanceStatus label: " + label));
    }
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\staff\entity\StaffDepartment.java ---

package com.boot.ict05_final_user.domain.staff.entity;

/**
 * 직원 부서 Enum
 *
 * <p>부서의 종류를 정의하며, 각 항목은 한글 설명(description)을 가진다.</p>
 *
 * <p>주요 부서:</p>
 * <ul>
 *     <li>OFFICE: 관리팀</li>
 *     <li>STORE: 판매팀</li>
 * </ul>
 */
public enum StaffDepartment {

    OFFICE("본사팀"),

    STORE("판매팀"),

    FRANCHISE("가맹관리팀"),

    OPS("운영지원팀"),

    HR("인사팀"),

    ANALYTICS("데이터분석팀"),

    ADMIN("관리팀");

    /** 한글 설명 */
    private final String description;

    /**
     * 생성자
     *
     * @param description 각 카테고리의 한글 설명
     */
    StaffDepartment(String description) {
        this.description = description;
    }

    /**
     * 카테고리 한글 설명을 반환한다.
     *
     * @return 카테고리 설명
     */
    public String getDescription() {
        return description;
    }
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\staff\entity\StaffEmploymentType.java ---

package com.boot.ict05_final_user.domain.staff.entity;

/**
 * 직원 근무형태 Enum
 *
 * <p>근무 형태의 종류를 정의하며, 각 항목은 한글 설명(description)을 가진다.</p>
 *
 * <p>주요 근무형태:</p>
 * <ul>
 *     <li>OWNER: 점주</li>
 *     <li>WORKER: 직원</li>
 *     <li>PART_TIMER: 알바</li>
 * </ul>
 */
public enum StaffEmploymentType {

    OWNER("점주"),

    WORKER("직원"),

    PART_TIMER("알바");

    /** 한글 설명 */
    private final String description;

    /**
     * 생성자
     *
     * @param description 각 카테고리의 한글 설명
     */
    StaffEmploymentType(String description) {
        this.description = description;
    }

    /**
     * 카테고리 한글 설명을 반환한다.
     *
     * @return 카테고리 설명
     */
    public String getDescription() {
        return description;
    }
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\staff\entity\StaffSchedule.java ---

package com.boot.ict05_final_user.domain.staff.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "staff_schedule")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffSchedule {

    /** 근무 배정 시퀀스 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "staff_schedule_id", columnDefinition = "BIGINT UNSIGNED")
    private Long id; // PK

    /** 매장 시퀀스 (fk) */
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "store_id_fk", nullable = false)
//    private Store store; // 매장 FK

    /** 직원 시퀀스 (fk) */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "staff_id_fk", nullable = false)
    private StaffProfile staff; // 직원 FK

    /** 근무시간대 시퀀스 (fk) */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "staff_shift_type_id_fk", nullable = false)
    private StaffShiftType shiftType; // 근무시간대 FK

    /** 근무 (예정) 일자 */
    @Column(name = "staff_schedule_work_date", nullable = false)
    private LocalDate staffScheduleWorkDate; // DATE

    /** 근무 배정 비고 */
    @Column(name = "staff_schedule_memo", columnDefinition = "TEXT")
    private String staffScheduleMemo; // TEXT (nullable)
}



--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\staff\entity\StaffShiftType.java ---

package com.boot.ict05_final_user.domain.staff.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import org.hibernate.annotations.Comment;

import java.time.LocalTime;

@Entity
@Table(name = "staff_shift_type")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffShiftType {

    /** 근무시간대 시퀀스 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "staff_shift_type_id", columnDefinition = "INT UNSIGNED")
    @Comment("근무시간대 시퀀스")
    private Long id;

    /** 근무시간대 이름 */
    @Column(name = "staff_shift_type_name", length = 100, nullable = false)
    @Comment("근무시간대 이름")
    private String TypeName;

    /** 근무 시작 시간 */
    @Column(name = "staff_shift_start_time", nullable = false)
    @Comment("시작")
    private LocalTime StartTime;

    /** 근무 종료 시간 */
    @Column(name = "staff_shift_end_time", nullable = false)
    @Comment("종료")
    private LocalTime EndTime;

    /** 근무시간대 설명 */
    @Column(name = "staff_shift_memo", columnDefinition = "TEXT")
    @Comment("근무시간대 설명")
    private String ShiftMemo;
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\store\entity\Store.java ---

package com.boot.ict05_final_user.domain.store.entity;

import com.boot.ict05_final_user.domain.user.entity.Member;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 가맹점(Store) JPA 엔티티.
 *
 * <p>DB 테이블 <code>store</code>과 매핑되며,
 * 계약/매출/상태 등 핵심 비즈니스 속성을 보유한다.</p>
 *
 */
@Entity                         // JPA 엔티티로 선언
@Table(name = "store")          // 매핑 테이블명 지정
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder                        // 빌더 패턴 지원(가독성 좋은 생성)
public class Store {

    /** 가맹점 시퀀스 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "store_id", columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    /** 본사 담당자 시퀀스 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id_fk", nullable = true)
    private Member member;  // FK 후보 - 본사 담당자

    /** 가맹점명 */
    @Column(name = "store_name", length = 150, nullable = false)
    private String name;

    /** 가맹점 주소 */
    @Column(name = "store_location", length = 255)
    private String location;

    /** 가맹점 구분(예: 직영/가맹). Enum 문자열로 저장 */
    @Enumerated(EnumType.STRING)
    @Column(name = "store_type", length = 10)
    @Builder.Default
    private StoreType type = StoreType.FRANCHISE;

    /** 가맹점 상태(예: 운영/개점준비/폐점). Enum 문자열로 저장 */
    @Enumerated(EnumType.STRING)
    @Column(name = "store_status", length = 10)
    @Builder.Default
    private StoreStatus status = StoreStatus.OPERATING;

    /** 총 직원수*/
    @Column(name = "store_total_employees")
    private Integer totalEmployees;

    /** 가맹점 계약 시작일 */
    @Column(name = "store_contract_start_date")
    private LocalDate contractStartDate;

    /** 가맹점 계약 가맹일 */
    @Column(name = "store_contract_affiliate_date")
    private LocalDate contractAffiliateDate;

    /** 가맹점 계약 기간 */
    @Column(name = "store_contract_term")
    private Integer contractTerm;

    /** 가맹점 가맹비 */
    @Column(name = "store_affiliate_price", precision = 14, scale = 2)
    private BigDecimal affiliatePrice;

    /** 월매출. DECIMAL(14,2)로 금액 정밀도 보장 */
    @Column(name = "store_monthly_sales", precision = 14, scale = 2)
    private BigDecimal monthlySales;

    /** 가맹점 연락처 */
    @Column(name = "store_phone", length = 50)
    private String phone;

    /** 가맹점 사업 등록번호 */
    @Column(name = "business_registration_number", length = 50)
    private String businessRegistrationNumber;

    /** 가맹점 특이사항 */
    @Column(name = "store_comment", columnDefinition = "TEXT")
    private String comment;

    /** 가맹점 로열티 */
    @Column(name = "store_royalty", precision = 8, scale = 4)
    private BigDecimal royalty;

}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\store\entity\StoreStatus.java ---

package com.boot.ict05_final_user.domain.store.entity;

/**
 * 가맹점 운영 상태를 표현하는 열거형(Enum).
 *
 * <p>JPA 엔티티에서 {@code @Enumerated(EnumType.STRING)}과 함께 사용하면
 * DB에는 상수명(OPERATING/PREPARING/CLOSED)으로 저장되고,
 * 화면에는 한국어 라벨({@link #description})을 표시할 수 있다.</p>
 */

public enum StoreStatus {

    /** 운영 중인 가맹점 */
    OPERATING("운영"),

    /** 개점 준비 중인 가맹점 */
    PREPARING("개점준비"),

    /** 폐업한 가맹점 */
    CLOSED("폐업");

    /** 각 상태의 한국어 라벨(뷰 표시용) */
    private final String description;

    /**
     * 열거형 생성자.
     *
     * @param description 상태의 한국어 라벨(예: "운영")
     */
    StoreStatus(String description) { this.description = description; } // OPERATING, PREPARING, CLOSED

    /**
     * 상태의 한국어 라벨을 반환한다.
     *
     * @return 한국어 라벨(예: "운영", "개점준비", "폐업")
     */
    public String getDescription() { return description; }
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\store\entity\StoreType.java ---

package com.boot.ict05_final_user.domain.store.entity;

/**
 * 가맹점 구분을 표현하는 열거형(Enum).
 *
 * <p>JPA 엔티티에서 {@code @Enumerated(EnumType.STRING)}으로 매핑하면
 * DB에는 상수명(DIRECT/FRANCHISE)으로 저장되고,
 * 화면에는 한국어 라벨({@link #description})을 사용할 수 있다.</p>
 */

public enum StoreType {

    /** 직영점 */
    DIRECT("직영점"),

    /** 가맹점 */
    FRANCHISE("가맹점");

    /** 각 구분의 한국어 라벨(뷰 표시용) */
    private final String description;

    /**
     * 열거형 생성자.
     *
     * @param description 한국어 라벨(예: "직영점", "가맹점")
     */
    StoreType(String description) { this.description = description; } // DIRECT, FRANCHISE

    /**
     * 카테고리 한글 설명을 반환한다.
     *
     * @return 카테고리 설명
     */
    public String getDescription() { return description; }
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\user\entity\Member.java ---

// src/main/java/.../domain/user/entity/Member.java
package com.boot.ict05_final_user.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "member")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "member_id")     // PK 컬럼명
    private Long id;

    @Column(name = "member_email", nullable = false, unique = true, length = 254)
    private String email;

    @Column(name = "member_password", nullable = false, length = 255)
    private String password;

    @Column(name = "member_name", nullable = false, length = 100)
    private String name;

    @Column(name = "member_phone", length = 20)
    private String phone;

    // 필요 시 created_at/updated_at 등 컬럼도 매핑

    @Column(name = "member_image_path")
    private String memberImagePath;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private MemberStatus status = MemberStatus.ACTIVE;
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\user\entity\MemberStatus.java ---

package com.boot.ict05_final_user.domain.user.entity;

public enum MemberStatus {
    ACTIVE,    // 정상 회원
    WITHDRAW   // 탈퇴 (숨김 처리)
}


--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\user\entity\UserRoleType.java ---

package com.boot.ict05_final_user.domain.user.entity;

public enum UserRoleType {
    USER,ADMIN

}
