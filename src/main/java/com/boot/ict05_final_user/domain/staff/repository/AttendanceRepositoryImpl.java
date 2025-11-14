package com.boot.ict05_final_user.domain.staff.repository;

import com.boot.ict05_final_user.domain.staff.dto.AttendanceListDTO;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public class AttendanceRepositoryImpl implements AttendanceRepositoryCustom {

    @PersistenceContext
    private EntityManager em;

    @Override
    public Page<AttendanceListDTO> findDailyAttendanceByStore(
            Long storeId,
            LocalDate workDate,
            Pageable pageable
    ) {

        // 1) 내용 조회
        List<AttendanceListDTO> content = em.createQuery("""
                SELECT new com.boot.ict05_final_user.domain.staff.dto.AttendanceListDTO(
                    a.id,
                    a.workDate,
                    a.checkIn,
                    a.checkOut,
                    a.status,
                    a.workHours,
                    null,               -- staffShiftTypeName (엔티티에 없으니 일단 null)
                    s.id,
                    s.staffName,
                    s.staffEmploymentType
                )
                FROM Attendance a
                JOIN a.staffProfile s
                WHERE a.workDate = :workDate
                  AND s.store.id = :storeId
                ORDER BY s.staffName ASC, a.checkIn ASC
                """, AttendanceListDTO.class)
                .setParameter("workDate", workDate)
                .setParameter("storeId", storeId)
                .setFirstResult((int) pageable.getOffset())
                .setMaxResults(pageable.getPageSize())
                .getResultList();

        // 2) 총 개수
        Long total = em.createQuery("""
                SELECT COUNT(a)
                FROM Attendance a
                JOIN a.staffProfile s
                WHERE a.workDate = :workDate
                  AND s.store.id = :storeId
                """, Long.class)
                .setParameter("workDate", workDate)
                .setParameter("storeId", storeId)
                .getSingleResult();

        return new PageImpl<>(content, pageable, total);
    }
}
