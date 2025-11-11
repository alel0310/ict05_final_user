package com.boot.ict05_final_user.domain.fcm.dto;

/**
 * 토픽 네이밍 규칙 유틸.
 * - 공지: store-all, store-{id}
 * - 재고부족: inv-low-{storeId}
 * - 유통임박: expire-soon-{storeId}
 */
public final class FcmTopics {
    private FcmTopics() {}
    public static String storeAll() { return "store-all"; }
    public static String store(long storeId) { return "store-" + storeId; }
    public static String invLow(long storeId) { return "inv-low-" + storeId; }
    public static String expireSoon(long storeId) { return "expire-soon-" + storeId; }
}
