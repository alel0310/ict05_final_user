package com.boot.ict05_final_user.domain.attendance.repository;

import com.boot.ict05_final_user.domain.attendance.dto.AttendanceDetailDTO;
import com.boot.ict05_final_user.domain.attendance.dto.AttendanceListDTO;
import com.boot.ict05_final_user.domain.attendance.dto.AttendanceSearchDTO;
import com.boot.ict05_final_user.domain.staff.entity.AttendanceStatus;
import com.boot.ict05_final_user.domain.staff.entity.QAttendance;
import com.boot.ict05_final_user.domain.staff.entity.QStaffProfile;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class AttendanceRepositoryImpl implements AttendanceRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Page<AttendanceListDTO> findDailyAttendanceByStore(
            Long storeId,
            LocalDate workDate,
            Pageable pageable,
            AttendanceSearchDTO dto
    ) {
        QAttendance attendance = QAttendance.attendance;
        QStaffProfile staff = QStaffProfile.staffProfile;

        BooleanBuilder condition = new BooleanBuilder();

        // 기본 조건: 날짜 + 점포
        condition.and(attendance.workDate.eq(workDate));
        if (storeId != null) {
            condition.and(staff.store.id.eq(storeId));
        }

        if (dto != null) {
            String keyword = dto.getKeyword();
            String type = dto.getType();
            AttendanceStatus statusFilter = dto.getAttendanceStatus();

            if (keyword != null && !keyword.isBlank()) {
                if ("name".equalsIgnoreCase(type)) {
                    condition.and(staff.staffName.containsIgnoreCase(keyword));
                } else if ("id".equalsIgnoreCase(type)) {
                    condition.and(staff.id.stringValue().containsIgnoreCase(keyword));
                } else { // all 또는 null
                    condition.and(
                            staff.staffName.containsIgnoreCase(keyword)
                                    .or(staff.id.stringValue().containsIgnoreCase(keyword))
                    );
                }
            }

            if (statusFilter != null) {
                condition.and(attendance.status.eq(statusFilter));
            }
        }

        // 1) 내용 쿼리
        JPAQuery<AttendanceListDTO> contentQuery = queryFactory
                .select(Projections.constructor(
                        AttendanceListDTO.class,
                        attendance.id,
                        attendance.workDate,
                        attendance.checkIn,
                        attendance.checkOut,
                        attendance.status,
                        attendance.workHours,
                        staff.id,
                        staff.staffName,
                        staff.staffEmploymentType
                ))
                .from(attendance)
                .join(attendance.staffProfile, staff)
                .where(condition)
                .orderBy(
                        staff.staffName.asc(),
                        attendance.checkIn.asc()
                );

        if (pageable.isPaged()) {
            contentQuery
                    .offset(pageable.getOffset())
                    .limit(pageable.getPageSize());
        }

        List<AttendanceListDTO> content = contentQuery.fetch();

        Long total = queryFactory
                .select(attendance.count())
                .from(attendance)
                .join(attendance.staffProfile, staff)
                .where(condition)
                .fetchOne();

        return new PageImpl<>(content, pageable, total == null ? 0 : total);
    }

    // ✅ 근태 상세 조회 쿼리 (attendance + staff JOIN)
    @Override
    public Optional<AttendanceDetailDTO> findAttendanceDetailByIdAndStore(Long attendanceId, Long storeId) {

        QAttendance attendance = QAttendance.attendance;
        QStaffProfile staff = QStaffProfile.staffProfile;

        BooleanBuilder condition = new BooleanBuilder();
        condition.and(attendance.id.eq(attendanceId));

        // 로그인한 점주의 매장에 속한 근태만 조회
        if (storeId != null) {
            condition.and(staff.store.id.eq(storeId));
        }

        AttendanceDetailDTO result = queryFactory
                .select(Projections.constructor(
                        AttendanceDetailDTO.class,
                        attendance.id,
                        attendance.workDate,
                        attendance.checkIn,
                        attendance.checkOut,
                        attendance.status,
                        attendance.workHours,
                        attendance.memo,
                        staff.id,
                        staff.staffName,
                        staff.staffEmploymentType
                ))
                .from(attendance)
                .join(attendance.staffProfile, staff)
                .where(condition)
                .fetchOne();

        return Optional.ofNullable(result);
    }

    // 직원 근태 삭제
    @Override
    public long deleteByStoreAndStaffAndWorkDate(Long storeId, Long staffId, LocalDate workDate) {
        QAttendance attendance = QAttendance.attendance;
        return queryFactory
                .delete(attendance)
                .where(
                        attendance.store.id.eq(storeId)
                                .and(attendance.staffProfile.id.eq(staffId))
                                .and(attendance.workDate.eq(workDate))
                )
                .execute();
    }

    @Override
    public long deleteByIdAndStore(Long attendanceId, Long storeId) {
        QAttendance attendance = QAttendance.attendance;

        return queryFactory
                .delete(attendance)
                .where(
                        attendance.id.eq(attendanceId)
                                .and(attendance.store.id.eq(storeId))  // Attendance 엔티티에 store 필드가 있어야 함
                )
                .execute();
    }
}
