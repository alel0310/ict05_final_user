package com.boot.ict05_final_user.domain.staff.repository;

import com.boot.ict05_final_user.domain.staff.dto.AttendanceListDTO;
import com.boot.ict05_final_user.domain.staff.entity.QAttendance;
import com.boot.ict05_final_user.domain.staff.entity.QStaffProfile;
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

@Repository
@RequiredArgsConstructor
public class AttendanceRepositoryImpl implements AttendanceRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Page<AttendanceListDTO> findDailyAttendanceByStore(
            Long storeId,
            LocalDate workDate,
            Pageable pageable
    ) {

        QAttendance attendance = QAttendance.attendance;
        QStaffProfile staff = QStaffProfile.staffProfile;

        // 1) 내용 쿼리
        JPAQuery<AttendanceListDTO> contentQuery = queryFactory
                .select(Projections.constructor(
                        AttendanceListDTO.class,
                        attendance.id,              // Long attendanceId
                        attendance.workDate,        // LocalDate attendanceWorkDate
                        attendance.checkIn,         // LocalDateTime attendanceCheckIn
                        attendance.checkOut,        // LocalDateTime attendanceCheckOut
                        attendance.status,          // AttendanceStatus attendanceStatus
                        attendance.workHours,       // BigDecimal attendanceWorkHours
                        staff.id,                   // Long staffId
                        staff.staffName,            // String staffName
                        staff.staffEmploymentType   // StaffEmploymentType staffEmploymentType
                ))
                .from(attendance)
                .join(attendance.staffProfile, staff)
                .where(
                        attendance.workDate.eq(workDate)
                                .and(staff.store.id.eq(storeId))
                )
                .orderBy(
                        staff.staffName.asc(),
                        attendance.checkIn.asc()
                );

        // 페이징 적용
        if (pageable.isPaged()) {
            contentQuery
                    .offset(pageable.getOffset())
                    .limit(pageable.getPageSize());
        }

        List<AttendanceListDTO> content = contentQuery.fetch();

        // 2) total count 쿼리
        Long total = queryFactory
                .select(attendance.count())
                .from(attendance)
                .join(attendance.staffProfile, staff)
                .where(
                        attendance.workDate.eq(workDate)
                                .and(staff.store.id.eq(storeId))
                )
                .fetchOne();

        return new PageImpl<>(content, pageable, total == null ? 0 : total);
    }
}
