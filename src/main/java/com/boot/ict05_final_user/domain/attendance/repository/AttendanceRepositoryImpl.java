package com.boot.ict05_final_user.domain.attendance.repository;

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

        // ===== 검색어 / 타입 처리 =====
        if (dto != null) {
            String keyword = dto.getKeyword();
            String type = dto.getType();
            AttendanceStatus statusFilter = dto.getAttendanceStatus();

            // 🔍 키워드 검색
            if (keyword != null && !keyword.isBlank()) {

                // type 에 따라 분기
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

            // 🔍 근태 상태 필터 (LATE, NORMAL, ABSENT 등)
            if (statusFilter != null) {
                condition.and(attendance.status.eq(statusFilter));
            }
        }


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
                .where(condition)
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
                .where(condition)
                .fetchOne();

        return new PageImpl<>(content, pageable, total == null ? 0 : total);
    }
}
