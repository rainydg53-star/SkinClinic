package com.skinclinic.domain.skin.survey.service;

import com.skinclinic.domain.skin.survey.dto.SkinSurveyRequest;
import com.skinclinic.domain.skin.survey.dto.SkinSurveyResponse;
import com.skinclinic.domain.skin.survey.entity.SkinSurvey;
import com.skinclinic.domain.skin.survey.repository.SkinSurveyRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;

@Service
@RequiredArgsConstructor
@Transactional
public class SkinSurveyService {
    private final SkinSurveyRepository skinSurveyRepository;

    public SkinSurveyResponse createSkinSurvey(Long userId, SkinSurveyRequest request) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }

        SkinSurvey skinSurvey = SkinSurvey.builder()
                .userId(userId)
                .skinType(request.getSkinType())
                .concerns(request.getConcerns() != null ? request.getConcerns() : new HashSet<>())
                .skinAreas(request.getSkinAreas() != null ? request.getSkinAreas() : new LinkedHashSet<>())
                .questionAnswers(request.getQuestionAnswers() != null ? request.getQuestionAnswers() : new LinkedHashMap<>())
                .build();

        SkinSurvey savedSkinSurvey = skinSurveyRepository.save(skinSurvey);
        return SkinSurveyResponse.from(savedSkinSurvey);
    }

    public SkinSurveyResponse getSkinSurvey(Long id, Long userId) {
        SkinSurvey skinSurvey = skinSurveyRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("해당 설문 결과를 찾을 수 없습니다. id" + id));

        if (userId == null || skinSurvey.getUserId() == null || !skinSurvey.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인의 설문 결과만 조회할 수 있습니다.");
        }

        return SkinSurveyResponse.from(skinSurvey);
    }

    public SkinSurveyResponse getLatestSkinSurveyByUser(Long userId) {
        SkinSurvey skinSurvey = skinSurveyRepository.findTopByUserIdOrderByIdDesc(userId)
                .orElseThrow(() -> new EntityNotFoundException("해당 회원의 피부 진단 결과를 찾을 수 없습니다. userId=" + userId));

        return SkinSurveyResponse.from(skinSurvey);
    }

    public Page<SkinSurveyResponse> getSkinSurveysByUser(Long userId, Pageable pageable) {
        return skinSurveyRepository.findByUserIdOrderByIdDesc(userId, pageable)
                .map(SkinSurveyResponse::from);
    }

}
