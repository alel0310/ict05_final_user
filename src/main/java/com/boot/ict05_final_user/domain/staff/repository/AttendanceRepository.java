package com.boot.ict05_final_user.domain.staff.repository;

import com.boot.ict05_final_user.domain.staff.entity.Attendance;
import com.boot.ict05_final_user.domain.staff.entity.StaffProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

//    /**
//     * 직원별 가장 최신 근태 상태를 한 번에 조회한다.
//     *
//     * @param staffIds 직원 ID 리스트
//     * @return [staff_id, attendance_status] 배열 리스트
//     */
//    @Query(value = """
//        SELECT a.staff_id, a.attendance_status
//        FROM attendance a
//        JOIN (
//            SELECT staff_id, MAX(event_at) AS mx
//            FROM attendance
//            WHERE staff_id IN (:staffIds)
//            GROUP BY staff_id
//        ) t ON a.staff_id = t.staff_id AND a.event_at = t.mx
//        """, nativeQuery = true)
//    List<Object[]> findLatestStatuses(@Param("staffIds") List<Long> staffIds);
}
