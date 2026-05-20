package com.skinclinic.domain.payment.repository;

import com.skinclinic.domain.payment.entity.Payment;
import com.skinclinic.domain.payment.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByMember_LoginIdOrderByCreatedAtDesc(String loginId);
    List<Payment> findByMember_LoginIdAndPaidAtGreaterThanEqualAndPaidAtLessThanOrderByCreatedAtDesc(
            String loginId,
            LocalDateTime from,
            LocalDateTime to
    );
    Optional<Payment> findByIdAndMember_LoginId(Long id, String loginId);
    Optional<Payment> findByOrderIdAndMember_LoginId(String orderId, String loginId);
    List<Payment> findByStatusAndCreatedAtBefore(PaymentStatus status, LocalDateTime createdAt);
    Optional<Payment> findTopByMember_IdAndProcedure_IdAndStatusOrderByCreatedAtDesc(
            Long memberId,
            Long procedureId,
            PaymentStatus status
    );
    long countByStatus(PaymentStatus status);
    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);
    long countByStatusAndCreatedAtBetween(PaymentStatus status, LocalDateTime from, LocalDateTime to);
    List<Payment> findAllByOrderByCreatedAtDesc();
    List<Payment> findByPaidAtGreaterThanEqualAndPaidAtLessThanOrderByCreatedAtDesc(LocalDateTime from, LocalDateTime to);
    boolean existsByMember_IdAndProcedure_IdAndStatus(Long memberId, Long procedureId, PaymentStatus status);
    boolean existsByReservationIdAndStatus(Long reservationId, PaymentStatus status);

    @Query("select coalesce(sum(p.amount), 0) from Payment p where p.status = :status")
    Long sumAmountByStatus(@Param("status") PaymentStatus status);

    @Query("""
            select coalesce(sum(p.amount), 0)
            from Payment p
            where p.status = :status
              and p.paidAt is not null
              and p.paidAt >= :from
              and p.paidAt < :to
            """)
    Long sumAmountByStatusAndPaidAtBetween(
            @Param("status") PaymentStatus status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query("""
            select p.procedure.id as procedureId,
                   p.procedureName as procedureName,
                   coalesce(sum(p.amount), 0) as totalAmount,
                   count(p) as totalCount
            from Payment p
            where p.status = :status
              and p.paidAt is not null
              and p.paidAt >= :from
              and p.paidAt < :to
            group by p.procedure.id, p.procedureName
            order by coalesce(sum(p.amount), 0) desc
            """)
    List<PaymentProcedureAggregateProjection> findTopProceduresByRevenue(
            @Param("status") PaymentStatus status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable
    );

    @Query("""
            select p.procedure.id as procedureId,
                   p.procedureName as procedureName,
                   coalesce(sum(p.amount), 0) as totalAmount,
                   count(p) as totalCount
            from Payment p
            where p.status = :status
              and p.paidAt is not null
              and p.paidAt >= :from
              and p.paidAt < :to
            group by p.procedure.id, p.procedureName
            order by count(p) desc, coalesce(sum(p.amount), 0) desc
            """)
    List<PaymentProcedureAggregateProjection> findTopProceduresByCount(
            @Param("status") PaymentStatus status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable
    );

    @Query("""
            select month(p.paidAt) as monthValue,
                   coalesce(sum(p.amount), 0) as totalAmount
            from Payment p
            where p.status = :status
              and p.paidAt is not null
              and p.paidAt >= :from
              and p.paidAt < :to
            group by month(p.paidAt)
            order by month(p.paidAt)
            """)
    List<PaymentMonthlySalesProjection> findMonthlySalesByPaidAtBetween(
            @Param("status") PaymentStatus status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );
}
