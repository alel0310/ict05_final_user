// src/main/java/com/boot/ict05_final_user/domain/fcm/service/FcmPreferenceService.java
package com.boot.ict05_final_user.domain.fcm.service;

import com.boot.ict05_final_user.domain.fcm.entity.AppType;
import com.boot.ict05_final_user.domain.fcm.entity.FcmDeviceToken;
import com.boot.ict05_final_user.domain.fcm.entity.FcmPreference;
import com.boot.ict05_final_user.domain.fcm.repository.FcmDeviceTokenRepository;
import com.boot.ict05_final_user.domain.fcm.repository.FcmPreferenceRepository;
import com.google.firebase.messaging.FirebaseMessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "fcm.enabled", havingValue = "true")
public class FcmPreferenceService {

	private final FcmPreferenceRepository repo;
	private final FcmDeviceTokenRepository tokenRepo;
	private final FcmService fcmService;

	/**
	 * 선호도 저장(업서트) + 토픽 동기화
	 */
	@Transactional
	public FcmPreference upsertForStoreMember(Long memberId, Long storeId,
											  Boolean catNotice, Boolean catStockLow, Boolean catExpireSoon,
											  Integer thresholdDays) {
		FcmPreference row = repo.findFirstByAppTypeAndMemberIdFk(AppType.STORE, memberId)
				.orElseGet(() -> FcmPreference.builder()
						.appType(AppType.STORE)
						.memberIdFk(memberId)
						.storeIdFk(storeId)
						.build());

		if (catNotice     != null) row.setCatNotice(catNotice);
		if (catStockLow   != null) row.setCatStockLow(catStockLow);
		if (catExpireSoon != null) row.setCatExpireSoon(catExpireSoon);
		if (thresholdDays != null) row.setThresholdDays(Math.max(0, thresholdDays));
		if (row.getStoreIdFk() == null && storeId != null) row.setStoreIdFk(storeId);

		FcmPreference saved = repo.save(row);

		// 저장 직후, 토픽 동기화 수행
		try {
			syncTopicsForMember(memberId, saved.getStoreIdFk(), saved);
		} catch (Exception e) {
			// 동기화 실패가 사용자 저장에 영향 주지 않도록 함
			log.warn("[FCM][PrefSync] sync failed memberId={} storeId={} err={}",
					memberId, saved.getStoreIdFk(), e.getMessage());
		}
		return saved;
	}

	@Transactional(readOnly = true)
	public FcmPreference getForStoreMember(Long memberId) {
		// 프론트 NPE 방지를 위해, 없으면 기본값으로 전달하는 것도 고려 가능
		return repo.findFirstByAppTypeAndMemberIdFk(AppType.STORE, memberId).orElse(null);
	}

	/**
	 * 멤버의 활성 토큰들을 매장 토픽에 일괄 구독/해제 (선호도에 따라)
	 */
	@Transactional(readOnly = true)
	public void syncTopicsForMember(Long memberId, Long storeId, FcmPreference pref) throws FirebaseMessagingException {
		if (memberId == null || storeId == null || pref == null) {
			log.debug("[FCM][PrefSync] skip: invalid args memberId={} storeId={} prefNull={}",
					memberId, storeId, (pref == null));
			return;
		}

		List<FcmDeviceToken> actives = tokenRepo.findByAppTypeAndMemberIdFkAndIsActiveTrue(AppType.STORE, memberId);
		if (actives.isEmpty()) {
			log.debug("[FCM][PrefSync] no active tokens for memberId={}, storeId={}", memberId, storeId);
			return;
		}
		List<String> tokens = actives.stream().map(FcmDeviceToken::getToken).toList();

		final String topicNotice   = "store-" + storeId;        // 매장 일반 공지
		final String topicInvLow   = "inv-low-" + storeId;      // 재고 부족
		final String topicExpire   = "expire-soon-" + storeId;  // 유통 임박

		// 매장 공지
		if (Boolean.TRUE.equals(pref.getCatNotice())) {
			fcmService.subscribeAll(tokens, topicNotice);
		} else {
			fcmService.unsubscribeAll(tokens, topicNotice);
		}

		// 재고 부족
		if (Boolean.TRUE.equals(pref.getCatStockLow())) {
			fcmService.subscribeAll(tokens, topicInvLow);
		} else {
			fcmService.unsubscribeAll(tokens, topicInvLow);
		}

		// 유통 임박
		if (Boolean.TRUE.equals(pref.getCatExpireSoon())) {
			fcmService.subscribeAll(tokens, topicExpire);
		} else {
			fcmService.unsubscribeAll(tokens, topicExpire);
		}

		log.info("[FCM][PrefSync] memberId={} storeId={} tokens={} notice={} invLow={} expire={}",
				memberId, storeId, tokens.size(),
				pref.getCatNotice(), pref.getCatStockLow(), pref.getCatExpireSoon());
	}
}
