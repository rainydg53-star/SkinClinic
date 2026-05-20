package com.skinclinic.domain.skindiagnosis.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skinclinic.domain.skindiagnosis.dto.SkinPhotoAnalysisResponse;
import com.skinclinic.domain.skindiagnosis.dto.SkinPhotoAnalysisResponse.RegionResult;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class SkinPhotoAnalysisService {

    private static final String[] REGIONS = {
            "FOREHEAD",
            "NOSE",
            "LEFT_CHEEK",
            "RIGHT_CHEEK",
            "CHIN"
    };

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String geminiApiKey;
    private final String geminiModel;

    public SkinPhotoAnalysisService(
            ObjectMapper objectMapper,
            @Value("${app.gemini.api-key}") String geminiApiKey,
            @Value("${app.gemini.model:gemini-2.5-flash}") String geminiModel
    ) {
        this.objectMapper = objectMapper;
        this.geminiApiKey = geminiApiKey == null ? "" : geminiApiKey.trim();
        this.geminiModel = (geminiModel == null || geminiModel.isBlank())
                ? "gemini-2.5-flash"
                : geminiModel.trim();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public SkinPhotoAnalysisResponse analyze(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return fallback("사진 파일이 비어 있습니다.");
        }

        if (geminiApiKey.isBlank()) {
            return fallback("Vision API 키가 비어 있습니다.");
        }

        byte[] imageBytes;
        try {
            imageBytes = file.getBytes();
        } catch (IOException e) {
            return fallback("사진을 읽는 중 오류가 발생했습니다.");
        }

        String mimeType = normalizeMimeType(file.getContentType());

        try {
            return analyzeWithGemini(imageBytes, mimeType);
        } catch (Exception e) {
            String msg = e.getMessage();
            if (msg == null || msg.isBlank()) {
                msg = e.getClass().getSimpleName();
            }
            return fallback("사진 분석 API 호출이 실패했습니다. " + msg);
        }
    }

    private SkinPhotoAnalysisResponse analyzeWithGemini(byte[] imageBytes, String mimeType) throws Exception {
        String imageBase64 = Base64.getEncoder().encodeToString(imageBytes);

        String prompt = """
                당신은 피부 이미지의 시각적 징후를 부위별로 판정하는 보조 분석기입니다.
                아래 기준을 충족하면 trouble=true로 판정하세요.

                [판정 기준]
                1) 피부 전체 톤과 달리 유난히 색조가 달라 보이는 영역
                2) 피부 전체 톤과 유난히 다른 색조가 점 형태로 다수 보이는 영역
                3) 기타 피부 트러블로 사료될 만한 특징(염증성/거친 질감/국소적 붉은기 등)

                주의:
                - 주근깨/색소 점도 위 기준에 부합하면 trouble 후보로 본다.
                - 과도한 과검출을 피하되, 위 1~3 기준이 보이면 trouble=true를 준다.
                - 의료 진단이 아닌 시각적 추정이다.

                Return ONLY JSON (no markdown, no explanations) in this exact schema:
                {
                  "message": "short korean message",
                  "regions": [
                    {"region":"FOREHEAD","trouble":false,"score":0.0},
                    {"region":"NOSE","trouble":false,"score":0.0},
                    {"region":"LEFT_CHEEK","trouble":false,"score":0.0},
                    {"region":"RIGHT_CHEEK","trouble":false,"score":0.0},
                    {"region":"CHIN","trouble":false,"score":0.0}
                  ]
                }

                Output rules:
                - score range: 0.0 ~ 1.0
                - Keep region names exactly as listed.
                - If image is too unclear, keep trouble=false with low score.
                """;

        Map<String, Object> req = new LinkedHashMap<>();
        List<Object> contents = new ArrayList<>();
        Map<String, Object> content = new LinkedHashMap<>();
        List<Object> parts = new ArrayList<>();

        parts.add(Map.of("text", prompt));
        parts.add(Map.of(
                "inline_data",
                Map.of(
                        "mime_type", mimeType,
                        "data", imageBase64
                )
        ));

        content.put("parts", parts);
        contents.add(content);
        req.put("contents", contents);

        String requestBody = objectMapper.writeValueAsString(req);

        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + geminiModel
                + ":generateContent?key="
                + geminiApiKey;

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(25))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response =
                httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            return fallback(buildApiErrorMessage(response.statusCode(), response.body()));
        }

        JsonNode root = objectMapper.readTree(response.body());
        String text = extractModelText(root);

        if (text == null || text.isBlank()) {
            return fallback("분석 결과를 해석하지 못했습니다.");
        }

        String jsonText = extractJsonObject(text);
        if (jsonText == null) {
            return fallback("분석 결과 형식이 올바르지 않습니다.");
        }

        JsonNode parsed = objectMapper.readTree(jsonText);
        String message = parsed.path("message").asText("사진 분석이 완료되었습니다.");

        Map<String, RegionResult> byRegion = new LinkedHashMap<>();
        for (String region : REGIONS) {
            byRegion.put(region, new RegionResult(region, false, "UNKNOWN", 0.0));
        }

        JsonNode regionsNode = parsed.path("regions");
        if (regionsNode.isArray()) {
            for (JsonNode n : regionsNode) {
                String region = n.path("region").asText("").toUpperCase(Locale.ROOT).trim();
                if (!byRegion.containsKey(region)) {
                    continue;
                }

                boolean trouble = n.path("trouble").asBoolean(false);
                double score = n.path("score").isNumber() ? n.path("score").asDouble() : 0.0;
                score = Math.max(0.0, Math.min(1.0, score));

                byRegion.put(
                        region,
                        new RegionResult(
                                region,
                                trouble,
                                trouble ? "TROUBLE" : "NORMAL",
                                round3(score)
                        )
                );
            }
        }

        return new SkinPhotoAnalysisResponse(
                true,
                false,
                message,
                new ArrayList<>(byRegion.values())
        );
    }

    private String normalizeMimeType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return "image/jpeg";
        }

        String ct = contentType.toLowerCase(Locale.ROOT);
        if (ct.contains("png")) return "image/png";
        if (ct.contains("webp")) return "image/webp";
        return "image/jpeg";
    }

    private String extractModelText(JsonNode root) {
        JsonNode candidates = root.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            return null;
        }

        JsonNode parts = candidates.get(0).path("content").path("parts");
        if (!parts.isArray() || parts.isEmpty()) {
            return null;
        }

        return parts.get(0).path("text").asText(null);
    }

    private String extractJsonObject(String text) {
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start < 0 || end <= start) {
            return null;
        }
        return text.substring(start, end + 1);
    }

    private SkinPhotoAnalysisResponse fallback(String message) {
        List<RegionResult> results = new ArrayList<>();
        for (String region : REGIONS) {
            results.add(new RegionResult(region, false, "UNKNOWN", 0.0));
        }
        return new SkinPhotoAnalysisResponse(false, true, message, results);
    }

    private String buildApiErrorMessage(int statusCode, String errorBody) {
        String safeBody = (errorBody == null || errorBody.isBlank()) ? "응답 본문 없음" : errorBody;

        try {
            JsonNode root = objectMapper.readTree(safeBody);
            JsonNode error = root.path("error");
            String apiMessage = error.path("message").asText("");

            if (statusCode == 429) {
                if (apiMessage.contains("GenerateRequestsPerDayPerProjectPerModel-FreeTier")
                        || apiMessage.contains("exceeded your current quota")) {
                    return "AI 분석 일일 사용 한도를 초과했습니다. 잠시 후 다시 시도하거나, 내일 다시 이용해 주세요.";
                }
                return "요청이 많아 AI 분석이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.";
            }

            if (statusCode >= 500) {
                return "AI 분석 서버 응답이 불안정합니다. 잠시 후 다시 시도해 주세요.";
            }

            if (!apiMessage.isBlank()) {
                return "사진 분석 요청에 실패했습니다. " + apiMessage;
            }
        } catch (Exception ignored) {
            // Ignore parse errors and fall back to generic message below.
        }

        return "분석 API 응답 오류(" + statusCode + ")가 발생했습니다.";
    }

    private static double round3(double v) {
        return Math.round(v * 1000.0) / 1000.0;
    }
}
