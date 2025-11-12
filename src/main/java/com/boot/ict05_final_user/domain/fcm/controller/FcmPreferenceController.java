package com.boot.ict05_final_user.domain.fcm.controller;

import com.boot.ict05_final_user.domain.fcm.dto.FcmPreferenceUpdateRequest;
import com.boot.ict05_final_user.domain.fcm.dto.StoreTopic;
import com.boot.ict05_final_user.domain.fcm.entity.AppType;
import com.boot.ict05_final_user.domain.fcm.entity.FcmPreference;
import com.boot.ict05_final_user.domain.fcm.entity.FcmDeviceToken;
import com.boot.ict05_final_user.domain.fcm.repository.FcmDeviceTokenRepository;
import com.boot.ict05_final_user.domain.fcm.service.FcmPreferenceService;
import com.boot.ict05_final_user.domain.fcm.service.FcmService;
import com.google.firebase.messaging.FirebaseMessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/fcm/pref")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('STORE','OWNER','STAFF','USER')")
public class FcmPreferenceController {

	private final FcmPreferenceService prefService;
	private final FcmDeviceTokenRepository tokenRepo;
	private final FcmService fcmService;

	/** JWT/Principal에서 storeId, memberId 추출 (간단 복제) */
	private static class Ids { Long storeId; Long memberId; }
	private Ids resolveIds(Object principal, String authHeader) {
		Ids ids = new Ids();
		try {
			if (principal != null) {
				var cls = principal.getClass();
				var mStore = cls.getMethod("getStoreId");
				var mMember = cls.getMethod("getMemberId");
				Object sid = mStore.invoke(principal);
				Object mid = mMember.invoke(principal);
				if (sid instanceof Number) ids.storeId = ((Number) sid).longValue();
				if (mid instanceof Number) ids.memberId = ((Number) mid).longValue();
			}
		} catch (Exception ignore) {}
		if ((ids.storeId == null || ids.memberId == null) && authHeader != null && authHeader.startsWith("Bearer ")) {
			try {
				String token = authHeader.substring(7);
				Long sid = com.boot.ict05_final_user.config.security.jwt.JWTUtil.getStoreId(token);
				Long mid = com.boot.ict05_final_user.config.security.jwt.JWTUtil.getMemberId(token);
				if (ids.storeId == null) ids.storeId = sid;
				if (ids.memberId == null) ids.memberId = mid;
			} catch (Exception e) { log.warn("[FCM] JWT parse failed: {}", e.getMessage()); }
		}
		return ids;
	}

	@GetMapping("/me")
	public Map<String,Object> getMyPref(@org.springframework.security.core.annotation.AuthenticationPrincipal Object me,
										@RequestHeader(value="Authorization", required=false) String auth) {
		Ids ids = resolveIds(me, auth);
		if (ids.memberId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "NO_AUTH");
		FcmPreference p = prefService.getForStoreMember(ids.memberId);

		Map<String,Object> res = new LinkedHashMap<>();
		res.put("memberId", ids.memberId);
		res.put("storeId", ids.storeId);
		res.put("catNotice",     p != null ? p.getCatNotice()     : true);
		res.put("catStockLow",   p != null ? p.getCatStockLow()   : true);
		res.put("catExpireSoon", p != null ? p.getCatExpireSoon() : true);
		res.put("thresholdDays", p != null ? p.getThresholdDays() : 3);
		return res;
	}

	@PutMapping("/me")
	public Map<String,Object> updateMyPref(@org.springframework.security.core.annotation.AuthenticationPrincipal Object me,
										   @RequestHeader(value="Authorization", required=false) String auth,
										   @RequestBody FcmPreferenceUpdateRequest req) {
		Ids ids = resolveIds(me, auth);
		if (ids.memberId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "NO_AUTH");

		FcmPreference saved = prefService.upsertForStoreMember(
				ids.memberId, ids.storeId,
				req.catNotice(), req.catStockLow(), req.catExpireSoon(), req.thresholdDays()
		);

		// 즉시 구독 반영
		boolean apply = (req.applySubscriptions() == null) || req.applySubscriptions();
		if (apply && ids.storeId != null) {
			List<FcmDeviceToken> tokens = tokenRepo.findByMemberIdFkAndIsActiveTrue(ids.memberId);
			try {
				if (req.catStockLow() != null) {
					String topic = StoreTopic.invLow(ids.storeId);
					for (FcmDeviceToken t : tokens) {
						if (req.catStockLow()) fcmService.subscribe(t.getToken(), topic);
						else                   fcmService.unsubscribe(t.getToken(), topic);
					}
				}
				if (req.catExpireSoon() != null) {
					String topic = StoreTopic.expireSoon(ids.storeId);
					for (FcmDeviceToken t : tokens) {
						if (req.catExpireSoon()) fcmService.subscribe(t.getToken(), topic);
						else                      fcmService.unsubscribe(t.getToken(), topic);
					}
				}
			} catch (FirebaseMessagingException e) {
				log.warn("[FCM] applySubscriptions failed", e);
			}
		}
		return Map.of("status","ok","prefId", saved.getFcmPreferenceId());
	}
}
