package com.boot.ict05_final_user.domain.staff.repository;

import com.boot.ict05_final_user.domain.staff.entity.QAttendance;
import com.boot.ict05_final_user.domain.staff.entity.QStaffProfile;
import com.boot.ict05_final_user.domain.staff.dto.StaffListDTO;
import com.boot.ict05_final_user.domain.staff.dto.StaffSearchDTO;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class StaffRepositoryImpl implements StaffRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Page<StaffListDTO> listStaff(StaffSearchDTO staffSearchDTO, Pageable pageable) {

        QStaffProfile staffProfile = QStaffProfile.staffProfile;
        QAttendance attendance = QAttendance.attendance;

        // 1️⃣ 기본 쿼리 정의
        JPAQuery<StaffListDTO> baseQuery = queryFactory
                .select(Projections.fields(StaffListDTO.class,
                        staffProfile.id,
                        staffProfile.staffName,
                        staffProfile.staffBirth,
                        staffProfile.staffDepartment,
                        staffProfile.staffEmploymentType,
                        staffProfile.staffStartDate,
                        attendance.status.as("attendanceStatus")
                ))
                .from(staffProfile)
                .leftJoin(attendance).on(attendance.staffProfile.eq(staffProfile))
                .where(eqTitleOrBody(staffSearchDTO, staffProfile))
                .orderBy(staffProfile.id.desc());

        // 2️⃣ 페이징이 걸려 있을 때만 offset/limit 적용
        if (pageable.isPaged()) {
            baseQuery.offset(pageable.getOffset())
                    .limit(pageable.getPageSize());
        }

        // 3️⃣ 결과 조회
        List<StaffListDTO> content = baseQuery.fetch();

        // 4️⃣ 전체 카운트
        long total = queryFactory
                .select(staffProfile.count())
                .from(staffProfile)
                .where(eqTitleOrBody(staffSearchDTO, staffProfile))
                .fetchOne();

        return new PageImpl<>(content, pageable, total);
    }


    // 검색어
    private BooleanExpression eqTitleOrBody(StaffSearchDTO staffSearchDTO, QStaffProfile staffProfile) {
        if (staffSearchDTO.getKeyword() == null) {
            return null;
        }
        String keyword = staffSearchDTO.getKeyword();

        return staffProfile.id.stringValue().containsIgnoreCase(keyword)
                .or(staffProfile.staffName.stringValue().containsIgnoreCase(keyword))
                .or(staffProfile.staffDepartment.stringValue().containsIgnoreCase(keyword));
    }
}