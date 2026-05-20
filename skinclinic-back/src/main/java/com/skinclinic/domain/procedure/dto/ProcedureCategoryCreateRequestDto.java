package com.skinclinic.domain.procedure.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProcedureCategoryCreateRequestDto {

    @NotBlank(message = "카테고리명은 필수입니다.")
    private String name;
}
