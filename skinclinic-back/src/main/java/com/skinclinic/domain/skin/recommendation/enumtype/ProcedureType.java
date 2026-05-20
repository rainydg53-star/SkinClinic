package com.skinclinic.domain.skin.recommendation.enumtype;

import lombok.Getter;

@Getter
public enum ProcedureType {
    ACNE_CARE("여드름 케어", "트러블, 피지, 염증성 피부 고민을 중심으로 한 관리"),
    SOOTHING_CARE("진정 관리", "예민해진 피부와 자극 받은 피부를 진정시키는 관리"),
    PORE_SEBUM_CARE("모공·피지 관리", "모공, 피지 분비, 번들거림을 집중적으로 관리"),
    BRIGHTENING_CARE("미백 관리", "색소 침착과 칙칙함 개선을 위한 관리"),
    REDNESS_CALMING_CARE("홍조 완화 관리", "붉은기와 열감, 예민 반응 완화를 위한 관리"),
    LIFTING_FIRMING_CARE("탄력·주름 관리", "잔주름과 탄력 저하 개선을 위한 관리"),
    HYDRATION_CARE("보습 관리", "수분 공급과 건조 완화를 위한 관리"),
    BARRIER_REPAIR_CARE("피부 장벽 관리", "피부 장벽 강화와 수분 유지에 도움이 되는 관리"),
    LOW_IRRITATION_CARE("저자극 관리", "민감한 피부를 고려한 저자극 중심 관리");

    private final String label;
    private final String description;

    ProcedureType(String label, String description) {
        this.label = label;
        this.description = description;
    }
}