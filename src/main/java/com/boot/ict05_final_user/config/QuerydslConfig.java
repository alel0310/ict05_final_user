package com.boot.ict05_final_user.config;


import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * QueryDSL 사용을 위해 사용하는 JPAQueryFactory
 */
@Configuration
public class QuerydslConfig {
	/**
	 * QueryDSL 사용을 위해 사용하는 JPAQueryFactory
	 */
	@Bean
	public JPAQueryFactory jpaQueryFactory(EntityManager entityManager) {
		return new JPAQueryFactory(entityManager);
	}
}
