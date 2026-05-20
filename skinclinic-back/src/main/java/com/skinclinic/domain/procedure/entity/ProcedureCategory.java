package com.skinclinic.domain.procedure.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "procedure_category",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_procedure_category_name", columnNames = {"name"})
        }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProcedureCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    public ProcedureCategory(String name) {
        this.name = name;
    }
}
