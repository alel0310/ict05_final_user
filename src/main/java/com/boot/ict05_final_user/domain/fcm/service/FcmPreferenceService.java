package com.boot.ict05_final_user.domain.fcm.service;

import com.boot.ict05_final_user.domain.fcm.entity.AppType;
import com.boot.ict05_final_user.domain.fcm.entity.FcmPreference;
import com.boot.ict05_final_user.domain.fcm.repository.FcmPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FcmPreferenceService {

	private final FcmPreferenceRepository repo;

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
		if (thresholdDays != null) row.setThresholdDays(thresholdDays);
		if (row.getStoreIdFk() == null && storeId != null) row.setStoreIdFk(storeId);

		return repo.save(row);
	}

	@Transactional(readOnly = true)
	public FcmPreference getForStoreMember(Long memberId) {
		return repo.findFirstByAppTypeAndMemberIdFk(AppType.STORE, memberId).orElse(null);
	}
}
