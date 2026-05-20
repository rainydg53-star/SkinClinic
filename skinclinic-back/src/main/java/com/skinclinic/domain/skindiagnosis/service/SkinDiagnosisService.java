package com.skinclinic.domain.skindiagnosis.service;

import com.skinclinic.domain.skindiagnosis.dto.SkinDiagnosisCreateRequest;
import com.skinclinic.domain.skindiagnosis.entity.SkinDiagnosis;
import com.skinclinic.domain.skindiagnosis.repository.SkinDiagnosisRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class SkinDiagnosisService {

    private final SkinDiagnosisRepository skinDiagnosisRepository;

    public SkinDiagnosis create(SkinDiagnosisCreateRequest request) {
        SkinDiagnosis diagnosis = SkinDiagnosis.create(
                request.memberId(),
                request.source() != null ? request.source() : "SURVEY",
                request.skinTypeResult(),
                request.mainConcern(),
                request.overallComment()
        );

        if (request.regions() != null) {
            for (SkinDiagnosisCreateRequest.RegionCondition regionCondition : request.regions()) {
                if (regionCondition.region() != null && !regionCondition.region().isBlank()) {
                    diagnosis.addRegion(
                            regionCondition.region().trim(),
                            regionCondition.conditionText() != null ? regionCondition.conditionText().trim() : null
                    );
                }
            }
        }

        return skinDiagnosisRepository.save(diagnosis);
    }

    @Transactional(readOnly = true)
    public List<SkinDiagnosis> getMyDiagnoses(Long memberId) {
        return skinDiagnosisRepository.findByMemberIdOrderByCreatedAtDesc(memberId);
    }

    @Transactional(readOnly = true)
    public SkinDiagnosis getMyDiagnosisDetail(Long memberId, Long diagnosisId) {
        return skinDiagnosisRepository.findByIdAndMemberId(diagnosisId, memberId)
                .orElseThrow(() -> new IllegalArgumentException("진단 결과를 찾을 수 없습니다."));
    }

    @Transactional(readOnly = true)
    public List<SkinDiagnosis> getAllDiagnoses() {
        return skinDiagnosisRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<SkinDiagnosis> getDiagnosesByMember(Long memberId) {
        return skinDiagnosisRepository.findByMemberIdOrderByCreatedAtDesc(memberId);
    }

    @Transactional(readOnly = true)
    public SkinDiagnosis getDiagnosisDetail(Long diagnosisId) {
        return skinDiagnosisRepository.findById(diagnosisId)
                .orElseThrow(() -> new IllegalArgumentException("진단 결과를 찾을 수 없습니다."));
    }
}
