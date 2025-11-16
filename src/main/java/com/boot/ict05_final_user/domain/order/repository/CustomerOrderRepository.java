package com.boot.ict05_final_user.domain.order.repository;

import com.boot.ict05_final_user.domain.order.entity.CustomerOrder;
import com.boot.ict05_final_user.domain.order.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {

    // 주방 화면에서 쓰던 메서드라면 그대로 두고
    List<CustomerOrder> findByStatusInOrderByOrderedAtAsc(List<OrderStatus> statuses);

    // 주문 리스트 화면용: 최신순 전체
    List<CustomerOrder> findAllByOrderByOrderedAtDesc();
}

