package com.skinclinic.domain.treatmentrecord.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@Getter
@Setter
public class TreatmentRecordCreateRequestDto {

    @NotNull(message = "회원 ID는 필수입니다.")
    private Long memberId;

    @NotNull(message = "시술 ID는 필수입니다.")
    private Long procedureId;

    private Long paymentId;

    @NotNull(message = "시술 날짜는 필수입니다.")
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate treatmentDate;

    private String notes;

    private MultipartFile beforeImage;

    private MultipartFile afterImage;
}
