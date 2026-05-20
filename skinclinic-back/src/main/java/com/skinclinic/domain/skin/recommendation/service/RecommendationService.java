package com.skinclinic.domain.skin.recommendation.service;

import com.skinclinic.domain.skin.recommendation.dto.ProcedureRecommendationDto;
import com.skinclinic.domain.skin.recommendation.dto.RecommendationRequest;
import com.skinclinic.domain.skin.recommendation.dto.RecommendationResponse;
import com.skinclinic.domain.skin.recommendation.entity.RecommendationHistory;
import com.skinclinic.domain.skin.recommendation.entity.RecommendationProcedure;
import com.skinclinic.domain.skin.recommendation.enumtype.ProcedureType;
import com.skinclinic.domain.skin.recommendation.repository.RecommendationHistoryRepository;
import com.skinclinic.domain.skin.survey.dto.SkinSurveyResponse;
import com.skinclinic.domain.skin.survey.entity.SkinSurvey;
import com.skinclinic.domain.skin.survey.enumtype.SkinConcern;
import com.skinclinic.domain.skin.survey.enumtype.SkinType;
import com.skinclinic.domain.skin.survey.repository.SkinSurveyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class RecommendationService {

    private static final int MINIMUM_RECOMMENDATION_SCORE = 5;
    private static final int MAX_RECOMMENDATION_COUNT = 3;

    private static final String HIGH = "HIGH";
    private static final String MEDIUM = "MEDIUM";

    private final RecommendationHistoryRepository recommendationHistoryRepository; // 추천 결과를 DB에서 저장하거나 꺼내옴
    private final SkinSurveyRepository skinSurveyRepository; // 사용자가 작성한 설문지 데이터를 DB에서 찾아옴

    // 1. 추천 생성
    @Transactional
    public RecommendationResponse createRecommendation(RecommendationRequest request){
        SkinSurvey survey = skinSurveyRepository.findById(request.getSurveyId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "설문을 찾을 수 없습니다."));

        Set<SkinConcern> concernSet = survey.getConcerns() == null
                ? new LinkedHashSet<>()
                : new LinkedHashSet<>(survey.getConcerns());

        // 추가 설문 관련
        Map<String, String> questionAnswers = survey.getQuestionAnswers() == null
                ? new LinkedHashMap<>()
                : new LinkedHashMap<>(survey.getQuestionAnswers());

        Map<ProcedureType, RecommendationAccumulator> accumulatorMap = new LinkedHashMap<>();
        // 추천 시술별로 점수와 이유를 모아두는 임시 저장소 / Map<키, 값>을 사용하여 누적값 표현

        for(SkinConcern concern : concernSet) {
            applyConcernRule(concern, accumulatorMap);
        } // 고민 목록을 하나씩 꺼내서 반복하여 추천 규칙에 반영 -> 점수를 Map에 누적

        applySkinTypeRule(survey.getSkinType(), accumulatorMap);
        // 피부 타입도 추천 규칙에 반영 -> 점수를 Map에 누적
        // 고민 규칙과 피부 타입 규칙은 성격이 달라서 분리

        applyQuestionRules(questionAnswers, accumulatorMap);  // 추가 설문 규칙

        List<RecommendationAccumulator> sortedRecommendations = accumulatorMap.values().stream()
                .filter(acc -> acc.getScore() >= MINIMUM_RECOMMENDATION_SCORE)
                .sorted(Comparator.comparingInt(RecommendationAccumulator::getScore).reversed()  // 점수 기준 정렬 (각 객체의 getScore() 값을 기준 정렬 기준을 뒤집음)
                        .thenComparing(acc -> acc.getProcedureType().name())) // 점수가 같으면 이름으로 정렬
                .limit(MAX_RECOMMENDATION_COUNT)
                .toList();


        // 부모 엔티티 생성 (공통 정보를 담는 바구니를 만드는 과정)
        RecommendationHistory history = RecommendationHistory.builder()
                .survey(survey)
                .skinType(survey.getSkinType())
                .concerns(concernSet)
                .build();

        // 추천 시술들(자식) 생성 및 연결
        for(RecommendationAccumulator accumulator : sortedRecommendations) {
            RecommendationProcedure procedure = RecommendationProcedure.builder()
                    .procedureType(accumulator.getProcedureType())
                    .score(accumulator.getScore())
                    .reasons(accumulator.getReasons())
                    .build();
            history.addProcedure(procedure); // 부모 엔티티에도 추가, 부모와 자식을 연결
        }
        RecommendationHistory saved = recommendationHistoryRepository.save(history); // 부모인 history뿐만 아니라, 그 안에 줄줄이 달린 자식들(procedure)까지 DB에 한꺼번에 저장
        return toResponse(saved); // 프론트엔드가 읽기 좋은 형태(DTO)로 돌려줌.
    }

    // 2. 추천 상세 조회 (단건 조회)
    public RecommendationResponse getRecommendation(Long recommendationId){
        RecommendationHistory history = recommendationHistoryRepository.findById(recommendationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "추천 결과를 찾을 수 없습니다."));
        return toResponse(history);  // 찾은 엔티티를 DTO로 바꿔서 반환
    }

    // 3. 설문 기준 이력 조회
    public Page<RecommendationResponse> getRecommendationHistories(Long surveyId, Pageable pageable){
        return recommendationHistoryRepository.findBySurveyIdOrderByCreatedAtDesc(surveyId, pageable) // surveyId 조건으로 찾고, createdAt 내림차순 정렬 후 페이지 단위로 반환
                .map(this::toResponse);
    }

    // 4. 전체 추천 이력 조회
    public Page<RecommendationResponse> getAllRecommendations(Pageable pageable){
        return recommendationHistoryRepository.findAllByOrderByCreatedAtDesc(pageable)  // 전체 조회, 생성일 최신순으로 페이징
                .map(this::toResponse);
    }

    // 5. 특정 사용자의 추천 이력 조회
    public Page<RecommendationResponse> getRecommendationHistoriesByUser(Long userId, Pageable pageable){
        return recommendationHistoryRepository.findBySurveyUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toResponse);
    }

    // 6. 데이터 변환 및 맵핑
    private RecommendationResponse toResponse(RecommendationHistory history) {
        List<ProcedureRecommendationDto> recommendationDtos = history.getProcedures().stream()
                .sorted(Comparator.comparingInt(RecommendationProcedure::getScore).reversed()
                        .thenComparing(procedure -> procedure.getProcedureType().name()))
                .map(procedure -> ProcedureRecommendationDto.builder()
                        .procedureCode(procedure.getProcedureType().name())
                        .procedureName(procedure.getProcedureType().getLabel())
                        .description(procedure.getProcedureType().getDescription())
                        .score(procedure.getScore())
                        .reasons(new ArrayList<>(procedure.getReasons()))
                        .build())
                .toList();

        return RecommendationResponse.builder()
                .recommendationId(history.getId())
                .surveyId(history.getSurvey().getId())
                .skinTypeCode(history.getSkinType().name())
                .concernCodes(history.getConcerns().stream().map(Enum::name).toList())
                .questionAnswers(history.getSurvey().getQuestionAnswers())
                .recommendations(recommendationDtos)
                .createdAt(history.getCreatedAt())
                .build();
    }

    // 7. 추천 엔진 핵심 로직, 설문 데이터(피부 고민, 피부 타입)를 분석하여 시술별 점수

    // 7-1.피부 고민에 따라 관리 시술의 가중치 누적
    private void applyConcernRule(SkinConcern concern, Map<ProcedureType, RecommendationAccumulator> map) {
        switch (concern) {
            case ACNE -> {
                addRecommendation(map, ProcedureType.ACNE_CARE, 3, "대표 고민에 여드름이 포함되어 가중");
                addRecommendation(map, ProcedureType.SOOTHING_CARE, 1, "트러블 완화를 위한 진정 관리가 보조로 반영됨");
                addRecommendation(map, ProcedureType.PORE_SEBUM_CARE, 1, "여드름과 피지·모공 고민이 함께 나타날 수 있어 반영됨");
            }
            case PORES -> {
                addRecommendation(map, ProcedureType.PORE_SEBUM_CARE, 3, "대표 고민에 모공이 포함되어 가중");
                addRecommendation(map, ProcedureType.ACNE_CARE, 1, "모공 고민은 피지·트러블 관리와 연관될 수 있어 반영됨");
            }
            case REDNESS -> {
                addRecommendation(map, ProcedureType.REDNESS_CALMING_CARE, 3, "대표 고민에 홍조가 포함되어 가중");
                addRecommendation(map, ProcedureType.SOOTHING_CARE, 2, "붉은기 완화를 위해 진정 관리가 함께 반영됨");
                addRecommendation(map, ProcedureType.LOW_IRRITATION_CARE, 1, "홍조 피부는 저자극 관리가 중요해 반영됨");
            }
            case WRINKLES -> {
                addRecommendation(map, ProcedureType.LIFTING_FIRMING_CARE, 3, "대표 고민에 주름이 포함되어 가중");
                addRecommendation(map, ProcedureType.HYDRATION_CARE, 1, "잔주름 관리에 보습 보조가 도움될 수 있어 반영됨");
            }
            case PIGMENTATION -> {
                addRecommendation(map, ProcedureType.BRIGHTENING_CARE, 3, "대표 고민에 색소침착이 포함되어 가중");
                addRecommendation(map, ProcedureType.SOOTHING_CARE, 1, "자극 완화 관리가 함께 도움될 수 있어 반영됨");
            }
            case DRYNESS -> {
                addRecommendation(map, ProcedureType.HYDRATION_CARE, 3, "대표 고민에 건조함이 포함되어 가중");
                addRecommendation(map, ProcedureType.BARRIER_REPAIR_CARE, 2, "건조 피부는 장벽 관리가 중요해 반영됨");
            }
            case SEBUM -> {
                addRecommendation(map, ProcedureType.PORE_SEBUM_CARE, 3, "대표 고민에 피지과다가 포함되어 가중");
                addRecommendation(map, ProcedureType.ACNE_CARE, 1, "과다 피지는 트러블과 연결될 수 있어 반영됨");
            }
        }
    }

    // 7-2. 사용자의 피부 타입에 따라 관리 시술의 가중치 누적
    private void applySkinTypeRule(SkinType skinType, Map<ProcedureType, RecommendationAccumulator> map) {
        if (skinType == null) {
            return;
        }

        switch (skinType) {
            case OILY -> addRecommendation(map, ProcedureType.PORE_SEBUM_CARE, 2, "지성 피부 특성을 반영해 피지·모공 관리 점수 추가");
            case DRY -> {
                addRecommendation(map, ProcedureType.HYDRATION_CARE, 2, "건성 피부 특성을 반영해 보습 관리 점수 추가");
                addRecommendation(map, ProcedureType.BARRIER_REPAIR_CARE, 1, "건성 피부의 장벽 관리 필요성이 반영됨");
            }
            case COMBINATION -> {
                addRecommendation(map, ProcedureType.PORE_SEBUM_CARE, 1, "복합성 피부의 유분 밸런스를 반영함");
                addRecommendation(map, ProcedureType.HYDRATION_CARE, 1, "복합성 피부의 수분 밸런스를 반영함");
            }
            case SENSITIVE -> {
                addRecommendation(map, ProcedureType.LOW_IRRITATION_CARE, 2, "민감성 피부 특성을 반영해 저자극 관리 점수 추가");
                addRecommendation(map, ProcedureType.SOOTHING_CARE, 1, "민감성 피부의 진정 필요성을 반영함");
                addRecommendation(map, ProcedureType.BARRIER_REPAIR_CARE, 1, "민감성 피부의 장벽 보호 필요성을 반영함");
            }
            case NORMAL -> addRecommendation(map, ProcedureType.HYDRATION_CARE, 1, "중성 피부의 기본 수분 유지 관리가 반영됨");
        }
    }

    // 7-3 추가 설문 10개 규칙
    private void applyQuestionRules(Map<String, String> questionAnswers, Map<ProcedureType, RecommendationAccumulator> map) {
        if (questionAnswers == null || questionAnswers.isEmpty()) {
            return;
        }

        questionAnswers.forEach((questionCode, answerCode) -> {
            switch (questionCode) {
                case "TIGHTNESS_AFTER_WASH" -> {
                    if (HIGH.equals(answerCode)) {
                        addRecommendation(map, ProcedureType.HYDRATION_CARE, 3, "세안 후 당김이 심해 보습 관리 필요성이 높음");
                        addRecommendation(map, ProcedureType.BARRIER_REPAIR_CARE, 2, "세안 후 당김은 피부 장벽 저하 신호일 수 있어 반영됨");
                    } else if (MEDIUM.equals(answerCode)) {
                        addRecommendation(map, ProcedureType.HYDRATION_CARE, 2, "세안 후 당김이 가끔 있어 보습 관리가 도움될 수 있음");
                        addRecommendation(map, ProcedureType.BARRIER_REPAIR_CARE, 1, "가벼운 장벽 보조 관리가 반영됨");
                    }
                }
                case "AFTERNOON_OILINESS" -> {
                    if (HIGH.equals(answerCode)) {
                        addRecommendation(map, ProcedureType.PORE_SEBUM_CARE, 3, "오후 번들거림이 심해 피지 조절 관리가 필요함");
                        addRecommendation(map, ProcedureType.ACNE_CARE, 1, "과한 유분은 트러블과 연결될 수 있어 반영됨");
                    } else if (MEDIUM.equals(answerCode)) {
                        addRecommendation(map, ProcedureType.PORE_SEBUM_CARE, 2, "오후 유분 증가가 있어 모공·피지 관리가 반영됨");
                    }
                }
                case "FREQUENT_REDNESS" -> {
                    if (HIGH.equals(answerCode)) {
                        addRecommendation(map, ProcedureType.REDNESS_CALMING_CARE, 3, "붉은기가 자주 올라와 홍조 완화 관리 필요성이 높음");
                        addRecommendation(map, ProcedureType.SOOTHING_CARE, 2, "자극 완화를 위한 진정 관리가 함께 반영됨");
                        addRecommendation(map, ProcedureType.LOW_IRRITATION_CARE, 1, "자극 민감도를 고려한 저자극 관리가 반영됨");
                    } else if (MEDIUM.equals(answerCode)) {
                        addRecommendation(map, ProcedureType.REDNESS_CALMING_CARE, 2, "간헐적 붉은기를 반영해 홍조 완화 관리가 반영됨");
                        addRecommendation(map, ProcedureType.SOOTHING_CARE, 1, "진정 관리가 보조로 반영됨");
                    }
                }
                case "COSMETIC_REACTION" -> {
                    if (HIGH.equals(answerCode)) {
                        addRecommendation(map, ProcedureType.LOW_IRRITATION_CARE, 3, "화장품 자극 반응이 잦아 저자극 관리 필요성이 높음");
                        addRecommendation(map, ProcedureType.BARRIER_REPAIR_CARE, 2, "민감 반응은 피부 장벽 강화가 중요해 반영됨");
                        addRecommendation(map, ProcedureType.SOOTHING_CARE, 1, "자극 진정 관리가 함께 반영됨");
                    } else if (MEDIUM.equals(answerCode)) {
                        addRecommendation(map, ProcedureType.LOW_IRRITATION_CARE, 2, "간헐적 자극 반응을 반영해 저자극 관리가 반영됨");
                        addRecommendation(map, ProcedureType.BARRIER_REPAIR_CARE, 1, "피부 장벽 보조 관리가 반영됨");
                    }
                }
                case "REPEATING_BREAKOUTS" -> {
                    if (HIGH.equals(answerCode)) {
                        addRecommendation(map, ProcedureType.ACNE_CARE, 3, "트러블이 반복적으로 올라와 여드름 케어 필요성이 높음");
                        addRecommendation(map, ProcedureType.SOOTHING_CARE, 1, "트러블 진정을 위한 보조 관리가 반영됨");
                        addRecommendation(map, ProcedureType.PORE_SEBUM_CARE, 1, "트러블과 피지 문제의 연관성을 반영함");
                    } else if (MEDIUM.equals(answerCode)) {
                        addRecommendation(map, ProcedureType.ACNE_CARE, 2, "간헐적 트러블 반복을 반영해 여드름 케어가 반영됨");
                        addRecommendation(map, ProcedureType.SOOTHING_CARE, 1, "가벼운 진정 관리가 보조로 반영됨");
                    }
                }
                case "VISIBLE_PORES" -> {
                    if (HIGH.equals(answerCode)) {
                        addRecommendation(map, ProcedureType.PORE_SEBUM_CARE, 3, "모공이 눈에 띄어 모공·피지 집중 관리가 필요함");
                        addRecommendation(map, ProcedureType.ACNE_CARE, 1, "모공 고민이 피지·트러블과 함께 나타날 수 있어 반영됨");
                    } else if (MEDIUM.equals(answerCode)) {
                        addRecommendation(map, ProcedureType.PORE_SEBUM_CARE, 2, "모공 고민이 있어 모공·피지 관리가 반영됨");
                    }
                }
                case "FLAKING_OR_DRY_PATCHES" -> {
                    if (HIGH.equals(answerCode)) {
                        addRecommendation(map, ProcedureType.HYDRATION_CARE, 3, "각질과 건조 패치가 자주 보여 보습 관리가 필요함");
                        addRecommendation(map, ProcedureType.BARRIER_REPAIR_CARE, 2, "각질성 건조는 장벽 케어 필요성이 높아 반영됨");
                    } else if (MEDIUM.equals(answerCode)) {
                        addRecommendation(map, ProcedureType.HYDRATION_CARE, 2, "간헐적 각질을 반영해 보습 관리가 반영됨");
                        addRecommendation(map, ProcedureType.BARRIER_REPAIR_CARE, 1, "장벽 보조 관리가 함께 반영됨");
                    }
                }
                case "DULL_TONE" -> {
                    if (HIGH.equals(answerCode)) {
                        addRecommendation(map, ProcedureType.BRIGHTENING_CARE, 3, "피부 톤이 칙칙하게 느껴져 미백 관리 필요성이 높음");
                    } else if (MEDIUM.equals(answerCode)) {
                        addRecommendation(map, ProcedureType.BRIGHTENING_CARE, 2, "피부 톤 저하 고민을 반영해 미백 관리가 반영됨");
                    }
                }
                case "FINE_LINES_OR_ELASTICITY" -> {
                    if (HIGH.equals(answerCode)) {
                        addRecommendation(map, ProcedureType.LIFTING_FIRMING_CARE, 3, "잔주름 또는 탄력 저하가 느껴져 탄력 관리 필요성이 높음");
                        addRecommendation(map, ProcedureType.HYDRATION_CARE, 1, "탄력 저하에 보습 보조 관리가 도움될 수 있어 반영됨");
                    } else if (MEDIUM.equals(answerCode)) {
                        addRecommendation(map, ProcedureType.LIFTING_FIRMING_CARE, 2, "초기 탄력 저하 신호를 반영해 탄력 관리가 반영됨");
                    }
                }
                case "HEAT_OR_STINGING" -> {
                    if (HIGH.equals(answerCode)) {
                        addRecommendation(map, ProcedureType.REDNESS_CALMING_CARE, 2, "열감이나 화끈거림이 자주 있어 홍조 완화 관리가 반영됨");
                        addRecommendation(map, ProcedureType.SOOTHING_CARE, 2, "열감 완화를 위한 진정 관리 필요성이 높음");
                        addRecommendation(map, ProcedureType.LOW_IRRITATION_CARE, 2, "자극 민감도를 고려해 저자극 관리가 반영됨");
                    } else if (MEDIUM.equals(answerCode)) {
                        addRecommendation(map, ProcedureType.REDNESS_CALMING_CARE, 1, "간헐적 열감을 반영해 홍조 완화 관리가 반영됨");
                        addRecommendation(map, ProcedureType.SOOTHING_CARE, 1, "진정 관리가 보조로 반영됨");
                        addRecommendation(map, ProcedureType.LOW_IRRITATION_CARE, 1, "저자극 관리가 보조로 반영됨");
                    }
                }
                default -> {
                }
            }
        });
    }

    // 7-4. 동일한 시술이 여러 규칙에서 추천될 경우, 점수를 합산하고 사유를 목록에 추가.
    private void addRecommendation(
            Map<ProcedureType, RecommendationAccumulator> map,
            ProcedureType procedureType,
            int score,
            String reason
    ) {
        map.computeIfAbsent(procedureType, RecommendationAccumulator::new)
                .add(score, reason);
    }


    // 8. 추천 점수 계산 과정에서 시술별로 점수와 사유들 합산 내부 연산 클래스
    private static class RecommendationAccumulator{
        private final ProcedureType procedureType;
        private int score;
        private final Set<String> reasons = new LinkedHashSet<>();

        public RecommendationAccumulator(ProcedureType procedureType) {
            this.procedureType = procedureType;
        }

        private void add(int score, String reason){
            this.score += score;
            this.reasons.add(reason);
        }

        public ProcedureType getProcedureType(){
            return procedureType;
        }

        public int getScore() {
            return score;
        }

        public Set<String> getReasons() {
            return reasons;
        }
    }

}
