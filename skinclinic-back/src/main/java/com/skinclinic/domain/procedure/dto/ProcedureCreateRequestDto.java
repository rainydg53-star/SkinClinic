package com.skinclinic.domain.procedure.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Getter
@Setter
public class ProcedureCreateRequestDto {

    @NotBlank(message = "시술명은 필수입니다.")
    private String name;

    @NotBlank(message = "한줄 설명은 필수입니다.")
    private String summary;

    @NotBlank(message = "상세 설명은 필수입니다.")
    private String description;

    @NotNull(message = "가격은 필수입니다.")
    private Integer price;

    @NotBlank(message = "카테고리는 필수입니다.")
    private String category;

    private boolean visible;

    private MultipartFile thumbnailImage;

    private List<MultipartFile> detailImages;
}