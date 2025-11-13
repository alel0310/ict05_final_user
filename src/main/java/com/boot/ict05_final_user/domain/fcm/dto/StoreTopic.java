package com.boot.ict05_final_user.domain.fcm.dto;

public final class StoreTopic {
	private StoreTopic() {}

	public static String storeAll() { return "store-all"; }
	public static String store(long storeId) { return "store-" + storeId; }
	public static String invLow(long storeId) { return "inv-low-" + storeId; }
	public static String expireSoon(long storeId) { return "expire-soon-" + storeId; }

	// === 호환용 별칭(구 코드 대응) ===
	public static String notice(long storeId) { return store(storeId); }
	public static String stockLow(long storeId) { return invLow(storeId); }

	public static boolean isAllowed(String topic) {
		return topic != null && (
				topic.equals("store-all") ||
						topic.startsWith("store-") ||
						topic.startsWith("inv-low-") ||
						topic.startsWith("expire-soon-")
		);
	}
}
