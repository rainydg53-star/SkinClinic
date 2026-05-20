export const skinTypes = [
  { value: "DRY", label: "건성" },
  { value: "OILY", label: "지성" },
  { value: "COMBINATION", label: "복합성" },
  { value: "SENSITIVE", label: "민감성" },
  { value: "NORMAL", label: "중성" },
];

export const skinConcerns = [
  { value: "ACNE", label: "여드름" },
  { value: "PORES", label: "모공" },
  { value: "REDNESS", label: "홍조" },
  { value: "WRINKLES", label: "주름" },
  { value: "PIGMENTATION", label: "색소침착" },
  { value: "DRYNESS", label: "건조함" },
  { value: "SEBUM", label: "피지과다" },
];

export const skinAreas = [
  { value: "FOREHEAD", label: "이마" },
  { value: "CHEEKS", label: "볼" },
  { value: "NOSE", label: "코" },
  { value: "CHIN", label: "턱" },
  { value: "JAWLINE", label: "턱선" },
  { value: "AROUND_EYES", label: "눈가" },
];

export const answerOptions = [
  { value: "HIGH", label: "자주 그래요" },
  { value: "MEDIUM", label: "가끔 그래요" },
  { value: "LOW", label: "거의 없어요" },
];

export const surveyQuestions = [
  {
    code: "TIGHTNESS_AFTER_WASH",
    title: "세안 후 피부가 심하게 당기나요?",
    description: "보습 부족과 장벽 약화 여부를 확인해요.",
  },
  {
    code: "AFTERNOON_OILINESS",
    title: "오후가 되면 얼굴이 많이 번들거리나요?",
    description: "피지 분비량과 유분 밸런스를 봐요.",
  },
  {
    code: "FREQUENT_REDNESS",
    title: "붉은기가 자주 올라오나요?",
    description: "홍조와 예민 반응 경향을 확인해요.",
  },
  {
    code: "COSMETIC_REACTION",
    title: "화장품을 바꾸면 쉽게 자극이 오나요?",
    description: "민감성, 저자극 관리 필요도를 확인해요.",
  },
  {
    code: "REPEATING_BREAKOUTS",
    title: "트러블이 반복적으로 올라오나요?",
    description: "여드름 케어 필요도를 확인해요.",
  },
  {
    code: "VISIBLE_PORES",
    title: "모공이 눈에 띄게 신경 쓰이나요?",
    description: "모공·피지 관리 필요도를 확인해요.",
  },
  {
    code: "FLAKING_OR_DRY_PATCHES",
    title: "각질이나 건조한 패치가 자주 보이나요?",
    description: "수분 부족과 장벽 상태를 확인해요.",
  },
  {
    code: "DULL_TONE",
    title: "피부가 칙칙하고 톤이 고르지 않다고 느끼나요?",
    description: "미백 관리 필요도를 확인해요.",
  },
  {
    code: "FINE_LINES_OR_ELASTICITY",
    title: "잔주름이나 탄력 저하가 신경 쓰이나요?",
    description: "탄력·주름 관리 필요도를 확인해요.",
  },
  {
    code: "HEAT_OR_STINGING",
    title: "열감이나 화끈거림을 자주 느끼나요?",
    description: "진정, 홍조 완화, 저자극 관리 필요도를 확인해요.",
  },
];

export const getSkinTypeLabel = (value) =>
  skinTypes.find((type) => type.value === value)?.label || value;

export const getSkinConcernLabel = (value) =>
  skinConcerns.find((concern) => concern.value === value)?.label || value;

export const getSkinAreaLabel = (value) =>
  skinAreas.find((area) => area.value === value)?.label || value;

export const getQuestionTitle = (code) =>
  surveyQuestions.find((question) => question.code === code)?.title || code;

export const getAnswerLabel = (value) =>
  answerOptions.find((option) => option.value === value)?.label || value;
