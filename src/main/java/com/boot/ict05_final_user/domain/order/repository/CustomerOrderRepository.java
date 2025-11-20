package com.boot.ict05_final_user.domain.order.repository;

import com.boot.ict05_final_user.domain.order.entity.CustomerOrder;
import com.boot.ict05_final_user.domain.order.entity.OrderStatus;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long>, CustomerOrderRepositoryCustom  {

    // 주방 화면에서 쓰던 메서드라면 그대로 두고
    List<CustomerOrder> findByStatusInOrderByOrderedAtAsc(List<OrderStatus> statuses);

    // 주문 리스트 화면용: 최신순 전체
    List<CustomerOrder> findAllByOrderByOrderedAtDesc();

    // 최신 주문 하나
    Optional<CustomerOrder> findTopByOrderByIdDesc();

    // 주방에서 사용할 주문 목록 조회 (가맹점 기준 + 상태 in)
    List<CustomerOrder> findByStore_IdAndStatusInOrderByOrderedAtAsc(
            Long storeId,
            List<OrderStatus> statuses
    );

    // ✅ 가맹점별 주문 조회
    List<CustomerOrder> findByStore_Id(Long storeId, Sort sort);

    // 주문 + 매장 + 디테일 + 디테일의 메뉴를 한 번에 로딩
    @EntityGraph(attributePaths = {"store", "details", "details.menuIdFk"})
    Optional<CustomerOrder> findById(Long id);  // ← 이름을 findById로!
}

