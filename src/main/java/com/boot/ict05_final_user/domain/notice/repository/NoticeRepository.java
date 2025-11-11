package com.boot.ict05_final_user.domain.notice.repository;

import com.boot.ict05_final_user.domain.notice.entity.Notice;
import org.springframework.data.jpa.repository.JpaRepository;


public interface NoticeRepository extends JpaRepository<Notice, Long>, NoticeRepositoryCustom {

}
