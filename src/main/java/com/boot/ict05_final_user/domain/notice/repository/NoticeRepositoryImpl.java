package com.boot.ict05_final_user.domain.notice.repository;

import com.boot.ict05_final_user.domain.notice.dto.NoticeSearchDTO;
import com.boot.ict05_final_user.domain.notice.entity.NoticePriority;
import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import com.boot.ict05_final_user.domain.notice.dto.NoticeListDTO;

import com.boot.ict05_final_user.domain.notice.entity.QNotice;
import com.boot.ict05_final_user.domain.notice.entity.QNoticeAttachment; // QNoticeAttachment 임포트
import com.querydsl.core.types.Projections;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;
import com.querydsl.jpa.JPAExpressions; // JPAExpressions 임포트

import java.util.List;

@Repository
@RequiredArgsConstructor
public class NoticeRepositoryImpl implements NoticeRepositoryCustom {

    private final JPAQueryFactory queryFactory;
    private final NoticeAttachmentRepository noticeAttachmentRepository; // NoticeAttachmentRepository 주입

	@Override
	public Page<NoticeListDTO> listNotice(NoticeSearchDTO noticeSearchDTO, Pageable pageable) {
		QNotice notice = QNotice.notice;
		QNoticeAttachment noticeAttachment = QNoticeAttachment.noticeAttachment;

		BooleanExpression searchPredicate = applySearchFilters(noticeSearchDTO, notice);

		List<NoticeListDTO> content = queryFactory
				.select(Projections.fields(NoticeListDTO.class,
						notice.id,
						notice.memberIdFk,
						notice.noticeCategory,
						notice.noticePriority,
						notice.noticeStatus,
						notice.isShow,
						notice.title,
						notice.body,
						notice.writer,
						notice.noticeCount,
						notice.registeredAt,

						// 1. 첨부파일 존재 여부 (기존 방식도 OK)
						ExpressionUtils.as(
								JPAExpressions.selectOne()
										.from(noticeAttachment)
										.where(noticeAttachment.noticeId.eq(notice.id))
										.exists(),
								"hasAttachment"
						),

						// 2. 첫 번째 첨부파일 URL (수정된 핵심 부분)
						ExpressionUtils.as(
								JPAExpressions
										.select(noticeAttachment.url)
										.from(noticeAttachment)
										.where(noticeAttachment.noticeId.eq(notice.id))
										.orderBy(noticeAttachment.id.asc())
										.limit(1), // .limit(1) 사용
								"firstAttachmentUrl" // 별칭을 밖에서 지정
						)
				))
				.from(notice)
				.where(searchPredicate)
				.orderBy(notice.id.desc())
				.offset(pageable.getOffset())
				.limit(pageable.getPageSize()) // (수정) .limit(pageFageSize()) -> .limit(pageable.getPageSize())
				.fetch();

		long total = queryFactory
				.select(notice.count())
				.from(notice)
				.where(searchPredicate)
				.fetchOne();

		return new PageImpl<>(content, pageable, total);
	}

    private BooleanExpression applySearchFilters(NoticeSearchDTO noticeSearchDTO, QNotice notice) {
        BooleanExpression keywordExpression = eqKeyword(noticeSearchDTO, notice);
        BooleanExpression priorityExpression = eqPriority(noticeSearchDTO.getPriority(), notice);

        if (keywordExpression != null && priorityExpression != null) {
            return keywordExpression.and(priorityExpression);
        } else if (keywordExpression != null) {
            return keywordExpression;
        } else {
            return priorityExpression;
        }
    }

    private BooleanExpression eqKeyword(NoticeSearchDTO noticeSearchDTO, QNotice notice) {
        String type = noticeSearchDTO.getType();
        String keyword = noticeSearchDTO.getS();

        if (!StringUtils.hasText(type) || !StringUtils.hasText(keyword)) {
            return null;
        }

        switch (type) {
            case "title":
                return notice.title.containsIgnoreCase(keyword);
            case "content":
                return notice.body.containsIgnoreCase(keyword);
            case "writer":
                return notice.writer.containsIgnoreCase(keyword);
            case "all":
                return notice.title.containsIgnoreCase(keyword)
                        .or(notice.body.containsIgnoreCase(keyword))
                        .or(notice.writer.containsIgnoreCase(keyword));
            default:
                return null;
        }
    }

    private BooleanExpression eqPriority(NoticePriority priority, QNotice notice) {
        if (priority == null) {
            return null;
        }
        return notice.noticePriority.eq(priority);
    }

    @Override
    public long countNotice(NoticeSearchDTO noticeSearchDTO) {
        QNotice notice = QNotice.notice;
        BooleanExpression searchPredicate = applySearchFilters(noticeSearchDTO, notice);

        return queryFactory
                .select(notice.count())
                .from(notice)
                .where(searchPredicate)
                .fetchOne();
    }

    @Override
    public long countByPriority(NoticePriority priority) {
        QNotice notice = QNotice.notice;
        return queryFactory
                .select(notice.count())
                .from(notice)
                .where(notice.noticePriority.eq(priority))
                .fetchOne();
    }
}