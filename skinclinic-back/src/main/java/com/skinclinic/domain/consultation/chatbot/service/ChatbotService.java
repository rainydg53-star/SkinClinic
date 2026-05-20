package com.skinclinic.domain.consultation.chatbot.service;

import com.skinclinic.domain.consultation.chatbot.dto.ChatbotMessageRequest;
import com.skinclinic.domain.consultation.chatbot.dto.ChatbotOptionDto;
import com.skinclinic.domain.consultation.chatbot.dto.ChatbotResponse;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ChatbotService {

    private static final Logger log = LoggerFactory.getLogger(ChatbotService.class);

    private final GeminiChatService geminiChatService;
    private final Map<String, Node> nodes = new LinkedHashMap<>();


    @PostConstruct
    public void init() {
        // 노드 등록
        // put(키:string , 값:node)
        nodes.put("ROOT", new Node(
                "ROOT",
                "기본 상담",
                "원하는 상담 주제를 버튼으로 선택해주세요.",
                false,
                false,
                List.of("SKIN_CONCERN", "PROCEDURE_INFO", "BOOKING_GUIDE", "FAQ", "HUMAN_COUNSEL")
        ));

        nodes.put("SKIN_CONCERN", new Node(
                "SKIN_CONCERN",
                "피부 고민 상담",
                "가장 궁금한 피부 고민을 선택해주세요.",
                false,
                false,
                List.of("CONCERN_ACNE", "CONCERN_PIGMENT", "CONCERN_PORE", "CONCERN_REDNESS")
        ));

        nodes.put("CONCERN_ACNE", new Node(
                "CONCERN_ACNE",
                "여드름 고민",
                "여드름 고민은 피지 분비, 염증, 생활 습관이 함께 영향을 주는 경우가 많아요. 자극적인 제품 사용을 줄이고 현재 트러블 상태에 맞는 관리를 받는 것이 중요해요. 반복되면 상담 후 치료 방향을 잡아보는 것이 좋아요.",
                true,
                false,
                List.of("ROOT", "HUMAN_COUNSEL")
        ));

        nodes.put("CONCERN_PIGMENT", new Node(
                "CONCERN_PIGMENT",
                "색소 고민",
                "색소 고민은 자외선과 피부 자극이 누적되면서 더 진해질 수 있어요. 자외선 차단을 꾸준히 하고 현재 색소 종류에 맞는 관리가 중요해요. 필요하면 상담 후 미백 관리나 토닝 방향을 안내받는 것이 좋아요.",
                true,
                false,
                List.of("ROOT", "HUMAN_COUNSEL")
        ));

        nodes.put("CONCERN_PORE", new Node(
                "CONCERN_PORE",
                "모공 고민",
                "모공 고민은 피지, 피부결, 탄력 저하가 함께 작용하는 경우가 많아요. 과한 압출이나 스크럽은 줄이고 피지 조절과 피부결 관리를 같이 보는 편이 좋아요. 피부 타입에 맞는 관리 주기를 상담으로 정하면 더 도움이 될 수 있어요.",
                true,
                false,
                List.of("ROOT", "HUMAN_COUNSEL")
        ));

        nodes.put("CONCERN_REDNESS", new Node(
                "CONCERN_REDNESS",
                "홍조 고민",
                "홍조가 있다면 강한 자극과 열감 유발 요인을 줄이는 것이 우선이에요. 민감한 피부일 수 있어서 저자극 진정 관리 위주로 접근하는 편이 좋아요. 증상이 반복되면 관리자 상담이나 진료 상담으로 이어보는 것을 권장드려요.",
                true,
                true,
                List.of("ROOT", "HUMAN_COUNSEL")
        ));

        nodes.put("PROCEDURE_INFO", new Node(
                "PROCEDURE_INFO",
                "시술 정보 안내",
                "궁금한 시술 정보를 선택해주세요.",
                false,
                false,
                List.of("PROCEDURE_ACNE", "PROCEDURE_TONING", "PROCEDURE_PORE", "PROCEDURE_SOOTHING")
        ));

        nodes.put("PROCEDURE_ACNE", new Node(
                "PROCEDURE_ACNE",
                "여드름 케어 안내",
                "여드름 케어는 피지, 염증, 압출 필요 여부를 함께 보고 진행하는 경우가 많아요. 현재 트러블 상태에 따라 스케일링, 진정 관리, 재생 관리가 조합될 수 있어요. 정확한 구성은 상담 후 피부 상태에 맞춰 정하는 편이 좋아요.",
                true,
                false,
                List.of("ROOT", "HUMAN_COUNSEL")
        ));

        nodes.put("PROCEDURE_TONING", new Node(
                "PROCEDURE_TONING",
                "색소 토닝 안내",
                "색소 토닝 계열 시술은 피부 톤과 잡티 개선을 목표로 반복 진행하는 경우가 많아요. 개인 피부 상태에 따라 횟수와 강도는 달라질 수 있어요. 상담 후 적절한 계획을 잡아보는 것이 좋아요.",
                true,
                false,
                List.of("ROOT", "HUMAN_COUNSEL")
        ));

        nodes.put("PROCEDURE_PORE", new Node(
                "PROCEDURE_PORE",
                "모공 관리 안내",
                "모공 관리는 피지 정리, 피부결 개선, 탄력 보완을 함께 보는 경우가 많아요. 한 번에 큰 변화보다는 꾸준한 관리가 중요해요. 피부 타입에 맞는 주기를 상담으로 정하면 더 좋아요.",
                true,
                false,
                List.of("ROOT", "HUMAN_COUNSEL")
        ));

        nodes.put("PROCEDURE_SOOTHING", new Node(
                "PROCEDURE_SOOTHING",
                "진정 관리 안내",
                "진정 관리는 예민해진 피부의 열감과 붉은기를 낮추고 장벽 회복을 돕는 데 초점을 둬요. 자극 후 민감해진 피부에 비교적 부담이 적은 편이에요. 현재 피부 상태에 따라 적용 가능 여부를 상담으로 확인해보는 것이 좋아요.",
                true,
                false,
                List.of("ROOT", "HUMAN_COUNSEL")
        ));

        nodes.put("BOOKING_GUIDE", new Node(
                "BOOKING_GUIDE",
                "예약 방법 안내",
                "예약 관련 항목을 선택해주세요.",
                false,
                false,
                List.of("BOOKING_RESERVE", "BOOKING_PAYMENT", "BOOKING_CHANGE", "BOOKING_PREPARE")
        ));

        nodes.put("BOOKING_RESERVE", new Node(
                "BOOKING_RESERVE",
                "예약 방법",
                "원하는 시술 또는 상담 항목을 선택한 뒤 날짜와 시간을 고르는 방식으로 진행하면 돼요. 피부 상태를 먼저 보고 싶다면 시술 예약보다 상담 예약을 먼저 선택하는 편이 좋아요.",
                true,
                false,
                List.of("ROOT", "HUMAN_COUNSEL")
        ));

        nodes.put("BOOKING_PAYMENT", new Node(
                "BOOKING_PAYMENT",
                "결제 방법",
                "결제는 예약 단계에서 안내되는 수단으로 진행하면 되고 결제 완료 후 예약 확정 여부를 다시 확인하면 돼요. 실제 결제 수단과 정책은 결제 페이지 안내를 기준으로 확인하는 것이 가장 정확해요.",
                true,
                false,
                List.of("ROOT", "HUMAN_COUNSEL")
        ));

        nodes.put("BOOKING_CHANGE", new Node(
                "BOOKING_CHANGE",
                "예약 변경/취소",
                "예약 변경이나 취소는 마이페이지 또는 상담 채널을 통해 처리하는 방식이 가장 많아요. 일정이 임박한 경우 정책이 다를 수 있어서 빠르게 문의하는 것이 좋아요.",
                true,
                true,
                List.of("ROOT", "HUMAN_COUNSEL")
        ));

        nodes.put("BOOKING_PREPARE", new Node(
                "BOOKING_PREPARE",
                "예약 전 준비사항",
                "예약 전에는 현재 복용 중인 약이나 최근 시술 이력을 미리 정리해두면 상담이 더 정확해져요. 자극이 큰 홈케어를 최근에 했다면 상담 시 함께 알려주는 것이 좋아요.",
                true,
                false,
                List.of("ROOT", "HUMAN_COUNSEL")
        ));

        nodes.put("FAQ", new Node(
                "FAQ",
                "FAQ 응답",
                "자주 묻는 질문을 선택해주세요.",
                false,
                false,
                List.of("FAQ_PRICE", "FAQ_RECOVERY", "FAQ_CYCLE", "FAQ_AFTERCARE")
        ));

        nodes.put("FAQ_PRICE", new Node(
                "FAQ_PRICE",
                "가격 문의",
                "시술 가격은 프로그램 구성과 횟수, 피부 상태에 따라 달라질 수 있어요. 정확한 비용은 상세 페이지나 상담 후 안내를 기준으로 확인하는 것이 가장 정확해요.",
                true,
                false,
                List.of("ROOT", "HUMAN_COUNSEL")
        ));

        nodes.put("FAQ_RECOVERY", new Node(
                "FAQ_RECOVERY",
                "회복 기간",
                "회복 기간은 시술 종류와 피부 민감도에 따라 차이가 커요. 가벼운 관리형 시술은 일상 복귀가 빠른 편이지만 자극이 있는 시술은 붉은기나 건조감이 며칠 이어질 수 있어요.",
                true,
                false,
                List.of("ROOT", "HUMAN_COUNSEL")
        ));

        nodes.put("FAQ_CYCLE", new Node(
                "FAQ_CYCLE",
                "권장 주기",
                "시술 주기는 피부 고민과 목표에 따라 달라져요. 보통은 초기 집중 관리 후 유지 주기를 잡는 방식이 많아서 상담으로 계획을 세우는 편이 좋아요.",
                true,
                false,
                List.of("ROOT", "HUMAN_COUNSEL")
        ));

        nodes.put("FAQ_AFTERCARE", new Node(
                "FAQ_AFTERCARE",
                "시술 후 관리",
                "시술 후에는 자외선 차단과 보습, 자극 최소화가 기본이에요. 강한 각질 제거제나 자극적인 제품은 잠시 쉬는 편이 좋아요. 이상 반응이 있으면 상담으로 바로 확인하는 것이 안전해요.",
                true,
                true,
                List.of("ROOT", "HUMAN_COUNSEL")
        ));

        nodes.put("HUMAN_COUNSEL", new Node(
                "HUMAN_COUNSEL",
                "관리자 1:1 상담 연결",
                "현재 정보만으로 판단이 어렵거나 예약 변경, 민감 반응처럼 확인이 필요한 경우에는 관리자 1:1 상담으로 연결하는 것이 좋아요.",
                true,
                true,
                List.of("ROOT")
        ));
    }

    // 첫 환영 인사
    public ChatbotResponse getWelcome() {
        Node node = nodes.get("ROOT");
        return toResponse(node, node.answer(), false);
    }

    // 버튼 선택 또는 직접 입력에 따른 답변
    public ChatbotResponse reply(ChatbotMessageRequest request) {
        String rawMessage = request.getMessage();
        String trimmedMessage = rawMessage == null ? "" : rawMessage.trim();
        log.info(
                "Chatbot reply request: hasMessage={}, messageLength={}, hasOptionCode={}, optionCode={}",
                request.hasMessage(),
                trimmedMessage.length(),
                request.hasOptionCode(),
                request.getOptionCode()
        );
        if (request.hasMessage()) {
            return replyByMessage(rawMessage);
        }
        if (request.hasOptionCode()) {
            return replyByOption(request.getOptionCode());
        }
        return buildFreeformResponse(
                "상담 안내",
                "질문 내용을 다시 입력해 주세요.",
                false,
                false,
                List.of("ROOT")
        );
    }

    private ChatbotResponse replyByOption(String optionCode) {
        Node node = nodes.get(optionCode);

        if (node == null) {
            return buildFreeformResponse(
                    "상담 안내",
                    "선택하신 상담 항목을 다시 확인해주세요. 필요하시면 아래 입력창에 궁금한 내용을 직접 남겨주셔도 돼요.",
                    false,
                    true,
                    List.of("ROOT", "HUMAN_COUNSEL")
            );
        }

        // 빠른 선택(버튼) 응답은 항상 하드코딩된 기본 답변을 사용한다.
        String answer = node.answer();
        boolean aiEnhanced = false;

        return toResponse(node, answer, aiEnhanced);
    }

    private ChatbotResponse replyByMessage(String message) {
        String trimmedMessage = message == null ? "" : message.trim();
        List<String> nextCodes = inferNextCodes(trimmedMessage);
        boolean handoffRecommended = shouldRecommendHandoff(trimmedMessage);
        log.info("Chatbot freeform: before gemini call. messageLength={}, handoffRecommended={}",
                trimmedMessage.length(), handoffRecommended);

        String fallbackAnswer = """
                입력해주신 내용을 바탕으로 보면 현재 고민에 맞는 관리 방향이나 예약 안내를 함께 확인해보는 것이 좋아요.
                증상 정도나 최근 시술 여부에 따라 안내가 달라질 수 있어서, 자세한 상태 확인이 필요하면 관리자 1:1 상담으로 이어드리는 편이 더 정확해요.
                """.trim();

        GeminiChatService.GeminiResult result =
                geminiChatService.answerFreeform(trimmedMessage, fallbackAnswer);
        log.info("Chatbot freeform: after gemini call. enhanced={}, answerLength={}",
                result.enhanced(), result.answer() == null ? 0 : result.answer().length());

        return buildFreeformResponse(
                "상담 답변",
                result.answer(),
                result.enhanced(),
                handoffRecommended,
                nextCodes
        );
    }

    // DTO 변환
    private ChatbotResponse toResponse(Node node, String answer, boolean aiEnhanced) {
        List<ChatbotOptionDto> options = toOptions(node.nextCodes());

        return ChatbotResponse.builder()
                .optionCode(node.code())
                .optionLabel(node.label())
                .answerTitle(node.label())
                .answerBody(answer)
                .aiEnhanced(aiEnhanced)
                .handoffRecommended(node.handoffRecommended())
                .suggestedOptions(options)
                .build();
    }

    private ChatbotResponse buildFreeformResponse(
            String title,
            String answer,
            boolean aiEnhanced,
            boolean handoffRecommended,
            List<String> nextCodes
    ) {
        return ChatbotResponse.builder()
                .optionCode("FREEFORM")
                .optionLabel(title)
                .answerTitle(title)
                .answerBody(answer)
                .aiEnhanced(aiEnhanced)
                .handoffRecommended(handoffRecommended)
                .suggestedOptions(toOptions(nextCodes))
                .build();
    }

    private List<ChatbotOptionDto> toOptions(List<String> nextCodes) {
        return nextCodes.stream()
                .map(nodes::get)
                .filter(java.util.Objects::nonNull)
                .map(next -> ChatbotOptionDto.builder()
                        .code(next.code())
                        .label(next.label())
                        .description(next.leaf() ? "선택 후 답변 보기" : "하위 메뉴 열기")
                        .build())
                .toList();
    }

    private List<String> inferNextCodes(String message) {
        String normalized = message.toLowerCase();

        if (containsAny(normalized, "여드름", "트러블", "뾰루지")) {
            return List.of("CONCERN_ACNE", "PROCEDURE_ACNE", "HUMAN_COUNSEL");
        }

        if (containsAny(normalized, "기미", "잡티", "색소", "톤", "미백")) {
            return List.of("CONCERN_PIGMENT", "PROCEDURE_TONING", "HUMAN_COUNSEL");
        }

        if (containsAny(normalized, "모공", "피지", "블랙헤드")) {
            return List.of("CONCERN_PORE", "PROCEDURE_PORE", "HUMAN_COUNSEL");
        }

        if (containsAny(normalized, "홍조", "붉", "민감", "진정")) {
            return List.of("CONCERN_REDNESS", "PROCEDURE_SOOTHING", "HUMAN_COUNSEL");
        }

        if (containsAny(normalized, "예약", "날짜", "시간", "변경", "취소")) {
            return List.of("BOOKING_GUIDE", "BOOKING_CHANGE", "HUMAN_COUNSEL");
        }

        if (containsAny(normalized, "가격", "비용", "얼마", "결제")) {
            return List.of("FAQ_PRICE", "BOOKING_PAYMENT", "HUMAN_COUNSEL");
        }

        if (containsAny(normalized, "회복", "붉은기", "붓기", "after", "애프터")) {
            return List.of("FAQ_RECOVERY", "FAQ_AFTERCARE", "HUMAN_COUNSEL");
        }

        return List.of("SKIN_CONCERN", "PROCEDURE_INFO", "BOOKING_GUIDE", "HUMAN_COUNSEL");
    }

    private boolean shouldRecommendHandoff(String message) {
        String normalized = message.toLowerCase();

        return containsAny(
                normalized,
                "심해", "악화", "아프", "통증", "붓", "화끈", "알러지", "부작용",
                "예약 변경", "예약취소", "취소", "결제", "가격", "비용", "진료", "상담"
        );
    }

    private boolean containsAny(String value, String... keywords) {
        for (String keyword : keywords) {
            if (value.contains(keyword)) {
                return true;
            }
        }
        return false;
    }


    record Node(String code, String label, String answer, boolean leaf, boolean handoffRecommended,
                List<String> nextCodes) {
    }

}
