package com.boot.ict05_final_user.domain.order.repository;

import com.boot.ict05_final_user.domain.order.entity.CustomerOrderDetail;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerOrderDetailRepository extends JpaRepository<CustomerOrderDetail, Long> {

}
