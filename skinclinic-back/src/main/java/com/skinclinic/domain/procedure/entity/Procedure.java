package com.skinclinic.domain.procedure.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "procedure_info")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Procedure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name; // 시술명

    @Column(nullable = false, length = 500)
    private String summary; // 한줄 설명

    @Lob
    private String description; // 상세 설명

    @Column(nullable = false)
    private Integer price; // 가격

    @Column(length = 255)
    private String imageUrl; // 썸네일 이미지 경로

    @Column(length = 50)
    private String category; // 카테고리

    @Column(nullable = false)
    private boolean visible; // 노출 여부

    @Column(nullable = false)
    private boolean deleted; // soft delete 여부

    @OneToMany(mappedBy = "procedure", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProcedureImage> detailImages = new ArrayList<>();

    @Builder
    public Procedure(String name, String summary, String description, Integer price,
                     String imageUrl, String category, boolean visible) {
        this.name = name;
        this.summary = summary;
        this.description = description;
        this.price = price;
        this.imageUrl = imageUrl;
        this.category = category;
        this.visible = visible;
        this.deleted = false;
    }

    public void addDetailImage(ProcedureImage procedureImage) {
        detailImages.add(procedureImage);
        procedureImage.setProcedure(this);
    }

    public void clearDetailImages() {
        detailImages.clear();
    }

    public void softDelete() {
        this.deleted = true;
        this.visible = false;
    }
}