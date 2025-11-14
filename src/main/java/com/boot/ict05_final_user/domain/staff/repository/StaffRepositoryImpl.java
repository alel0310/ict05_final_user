package com.boot.ict05_final_user.domain.staff.repository;

import com.boot.ict05_final_user.domain.staff.dto.StaffListDTO;
import com.boot.ict05_final_user.domain.staff.dto.StaffSearchDTO;
import com.boot.ict05_final_user.domain.staff.entity.QAttendance;
import com.boot.ict05_final_user.domain.staff.entity.QStaffProfile;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import com.querydsl.core.types.Predicate;
import java.util.List;


@Repository
@RequiredArgsConstructor
public class StaffRepositoryImpl implements StaffRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Page<StaffListDTO> listStaff(StaffSearchDTO dto, Pageable pageable) {

        QStaffProfile staff = QStaffProfile.staffProfile;
        QAttendance attendance = QAttendance.attendance;
        QAttendance a2 = new QAttendance("a2"); // 서브쿼리용 alias

        BooleanBuilder condition = new BooleanBuilder();

        condition.and(eqStore(dto, staff));
        condition.and(eqTitleOrBody(dto, staff));

        // 1) 내용 조회 쿼리
        JPAQuery<StaffListDTO> contentQuery = queryFactory
                .select(Projections.fields(
                        StaffListDTO.class,
                        staff.id,
                        staff.staffName,
                        staff.staffBirth,
                        staff.staffPhone,
                        staff.staffEmploymentType,
                        staff.staffStartDate,
                        attendance.status.as("attendanceStatus")   // DTO 필드명과 동일
                ))
                .from(staff)
                // 🔥 직원별 “가장 최근 attendance 한 줄”만 LEFT JOIN
                .leftJoin(attendance).on(
                        attendance.staffProfile.eq(staff)
                                .and(attendance.id.eq(
                                        com.querydsl.jpa.JPAExpressions
                                                .select(a2.id.max())
                                                .from(a2)
                                                .where(a2.staffProfile.eq(staff))
                                ))
                )
                .where(condition)
                .orderBy(staff.id.desc())
                .distinct();

        // 페이징
        if (pageable.isPaged()) {
            contentQuery
                    .offset(pageable.getOffset())
                    .limit(pageable.getPageSize());
        }

        List<StaffListDTO> content = contentQuery.fetch();

        // 2) 총 카운트
        Long total = queryFactory
                .select(staff.count())
                .from(staff)
                .where(condition)
                .fetchOne();

        return new PageImpl<>(content, pageable, total == null ? 0 : total);
    }

    // 🔍 가맹점 조건
    private BooleanExpression eqStore(StaffSearchDTO dto, QStaffProfile staff) {
        if (dto.getStoreId() == null) return null;
        // StaffProfile에 private Store store; 있으면 이렇게
        return staff.store.id.eq(dto.getStoreId());
        // 만약 Long storeIdFk; 로 들고 있으면:
        // return staff.storeIdFk.eq(dto.getStoreId());
    }

    // 🔍 검색어 조건
    private BooleanExpression eqTitleOrBody(StaffSearchDTO dto, QStaffProfile staff) {
        if (dto.getKeyword() == null || dto.getKeyword().isBlank()) {
            return null;
        }
        String keyword = dto.getKeyword();

        return staff.id.stringValue().containsIgnoreCase(keyword)
                .or(staff.staffName.containsIgnoreCase(keyword))
                .or(staff.staffDepartment.stringValue().containsIgnoreCase(keyword));
    }
}
