package com.skinclinic.domain.procedure.review.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "procedure_review_member")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProcedureReviewMember {

    @Id
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, length = 30, unique = true)
    private String phone;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public ProcedureReviewMember(Long id, String name, String phone) {
        this.id = id;
        this.name = name;
        this.phone = phone;
        this.createdAt = LocalDateTime.now();
    }
}
