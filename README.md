<div align="center">

# 🌿 NURI CLINIC

### 피부 진단 · 시술 추천 · 예약 · 상담 통합 플랫폼

<img width="860" height="483" alt="image" src="https://github.com/user-attachments/assets/7233cffe-927a-4604-b060-7dde98f3bdc2" />

<br />

### 🛠 Tech Stack

#### Frontend
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

#### Backend
![Java](https://img.shields.io/badge/Java_21-orange?style=for-the-badge)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![Spring Security](https://img.shields.io/badge/Spring_Security-6DB33F?style=for-the-badge&logo=springsecurity&logoColor=white)

#### Database & Infra
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazonaws&logoColor=white)

</div>

<br />
<br />

---

# 💡 프로젝트 소개

누리클리닉은 사용자가 자신의 피부 상태에 적합한 시술 정보를  
쉽고 편리하게 제공받을 수 있도록 제작한 스킨클리닉 플랫폼입니다.

3D 얼굴 진단 기술을 활용하여 피부 상태를 분석하고,  
그 결과를 바탕으로 맞춤형 시술 추천 서비스를 제공합니다.

또한 상담부터 예약·결제까지 하나의 서비스에서 이용할 수 있도록 구현하였습니다.

<br />

<div align="center">
<img width="1924" height="1041" alt="image" src="https://github.com/user-attachments/assets/04e5b3b2-8822-4853-9ecd-44d2e3b7cd16" />
</div>

<br />

<div align="center">
<img width="1360" height="686" alt="image" src="https://github.com/user-attachments/assets/f427d0de-2664-43f5-aa2d-66ddaddc9b8e" />
</div>

<br />
<br />

---

# 📌 프로젝트 목표

- 피부 진단과 시술 추천 기능 통합
- 사용자 편의 중심 예약 시스템 구축
- 상담·결제·알림 기능까지 하나의 플랫폼으로 제공
- 실제 서비스 수준의 웹 플랫폼 구현
  
---

# 👨‍💻 주요 기능

## ✅ 사용자 기능

- 회원가입 / 로그인 / 마이페이지
- 피부 설문 및 3D 얼굴 진단
- 맞춤 시술 추천
- 예약 / 결제 / 일정 조회
- 챗봇 상담 및 1:1 상담
- 시술 기록 / 만족도 평가 / 알림

<br />

## ✅ 관리자 기능

- 회원 관리
- 예약 / 일정 관리
- 결제 관리
- 상담 관리
- 시술 관리
- 대시보드 및 통계 관리

<br />
<br />

---

# 📕 발표 PPT

🔗 [누리클리닉 발표 PPT 보기](https://drive.google.com/file/d/1kjmIk83D4pVZIO99BJXZYaaLMmFbFgRf/view?usp=sharing)

<br />
<br />

---

# 🧑‍💼 담당 역할

## 윤진성

<div align="center">
<img width="1920" height="1036" alt="image" src="https://github.com/user-attachments/assets/170e77f1-55c1-49cd-a4c8-8554060cf797" />
</div>

<img width="1361" height="761" alt="image" src="https://github.com/user-attachments/assets/70be78ad-87dd-44ad-9334-e293a93a5e7e" />

<img width="1361" height="761" alt="image" src="https://github.com/user-attachments/assets/f9e40c86-e06e-4002-908d-27119918024c" />

<img width="1358" height="760" alt="image" src="https://github.com/user-attachments/assets/3bf698e3-847d-4081-bb50-5e3a25df8d06" />

<img width="1358" height="756" alt="image" src="https://github.com/user-attachments/assets/61268dfc-1a81-4e87-8abe-c86905f48110" />


<br />
<br />

---
# 📕트러블 슈팅
-	문제 : Spring Security 적용 후 일부 API 요청에서 로그인 페이지로 302 Redirect 되는 문제가 발생했습니다.
프론트엔드와 백엔드 연동 과정에서 인증이 필요한 경로와 허용 경로가 충돌하며 정상적인 API 호출이 이루어지지 않았습니다.
-	해결 : SecurityConfig의 permitAll 경로와 인증 처리 구조를 다시 정리하고, 세션 인증 및 API 요청 흐름을 재구성하여 문제를 해결했습니다.
또한 React fetch 요청에서 credentials 설정을 추가하여 세션 유지 문제를 함께 해결했습니다.
-	성과 : Spring Security 인증 흐름과 세션 기반 로그인 구조에 대한 이해도를 높일 수 있었으며, 프론트엔드 · 백엔드 간 인증 처리 방식에 대한 실무적인 경험을 쌓을 수 있었습니다.


---
# 📌 프로젝트 소감

-	이 프로젝트를 통해 단순 기능 구현이 아니라 실제 서비스 구조를 직접 설계하고 연결하는 경험을 할 수 있었습니다.
-	회원가입, 로그인, 예약, 인증, 관리자 기능 등 여러 기능을 직접 구현하며 프론트엔드와 백엔드의 데이터 흐름을 자연스럽게 이해할 수 있었고, 오류 발생 시 원인을 분석하고 해결하는 과정에서 문제 해결 능력을 키울 수 있었습니다.
-	또한 사용자 입장에서 기능 흐름과 사용 편의성을 고민하며 개발하는 경험을 통해 서비스 구조와 유지보수의 중요성을 배울 수 있었습니다.
