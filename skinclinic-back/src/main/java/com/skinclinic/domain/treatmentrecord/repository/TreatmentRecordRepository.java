package com.skinclinic.domain.treatmentrecord.repository;

import com.skinclinic.domain.treatmentrecord.entity.TreatmentRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TreatmentRecordRepository extends JpaRepository<TreatmentRecord, Long> {
    List<TreatmentRecord> findByMember_LoginIdOrderByTreatmentDateDescIdDesc(String loginId);
    List<TreatmentRecord> findByMember_IdOrderByTreatmentDateDescIdDesc(Long memberId);
    Optional<TreatmentRecord> findByIdAndMember_Id(Long id, Long memberId);
    Optional<TreatmentRecord> findByIdAndMember_LoginId(Long id, String loginId);
    Optional<TreatmentRecord> findTopByMember_IdOrderByTreatmentDateDescIdDesc(Long memberId);
    boolean existsByPayment_Id(Long paymentId);

    @Query(
            value = """
                    select
                        tr.member.id as memberId,
                        tr.member.name as memberName,
                        tr.member.loginId as loginId,
                        max(tr.treatmentDate) as latestTreatmentDate,
                        count(tr.id) as recordCount
                    from TreatmentRecord tr
                    where (:keyword is null or :keyword = '' or
                           lower(tr.member.name) like lower(concat('%', :keyword, '%')) or
                           lower(tr.member.loginId) like lower(concat('%', :keyword, '%')))
                    group by tr.member.id, tr.member.name, tr.member.loginId
                    order by
                        case when :sortOrder = 'asc' then max(tr.treatmentDate) end asc,
                        case when :sortOrder = 'asc' then max(tr.id) end asc,
                        case when :sortOrder <> 'asc' then max(tr.treatmentDate) end desc,
                        case when :sortOrder <> 'asc' then max(tr.id) end desc
                    """,
            countQuery = """
                    select count(distinct tr.member.id)
                    from TreatmentRecord tr
                    where (:keyword is null or :keyword = '' or
                           lower(tr.member.name) like lower(concat('%', :keyword, '%')) or
                           lower(tr.member.loginId) like lower(concat('%', :keyword, '%')))
                    """
    )
    Page<TreatmentRecordMemberSummaryProjection> findMemberSummariesByKeyword(
            @Param("keyword") String keyword,
            @Param("sortOrder") String sortOrder,
            Pageable pageable
    );
}
