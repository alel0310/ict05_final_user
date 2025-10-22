import React, { useState } from 'react';
import { KPICard } from '../Common/KPICard';
import { DataTable } from '../Common/DataTable';
import { StatusBadge } from '../Common/StatusBadge';
import { DownloadToggle } from '../Common/DownloadToggle';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  MessageSquare, 
  BookOpen, 
  Eye, 
  Download,
  Search,
  Filter,
  Bell,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle,
  Calendar,
  Paperclip,
  Star,
  User,
  X
} from 'lucide-react';
import { toast } from 'sonner';

// 받은 공지사항 데이터 (임시)
const receivedNotices = [
  {
    id: 1,
    title: '2024년 1월 신메뉴 출시 안내',
    content: `새로운 시즌 메뉴가 출시됩니다. 
    
1. 신메뉴 목록
- 매콤 치킨 버거: 9,500원
- 시그니처 샐러드: 8,900원
- 프리미엄 파스타: 12,000원

2. 준비 사항
- 새로운 재료 발주 필요
- 직원 교육 실시 필수
- 메뉴판 교체

모든 가맹점에서는 새로운 메뉴 교육을 받아주시기 바랍니다.`,
    type: '일반',
    priority: '보통',
    category: '메뉴',
    author: '본사 마케팅팀',
    receivedDate: '2024-01-02',
    isRead: true,
    readDate: '2024-01-02 14:30',
    hasAttachment: true,
    attachments: ['신메뉴_가이드.pdf', '재료_발주서.xlsx'],
    isImportant: false,
  },
  {
    id: 2,
    title: '긴급: 식품안전 관리 지침 업데이트',
    content: `식품안전 관리 지침이 업데이트되었습니다.

주요 변경사항:
1. 냉장고 온도 체크 주기: 2시간 → 1시간
2. 유통기한 확인 절차 강화
3. 새로운 위생 체크리스트 적용

즉시 확인하여 적용해주시기 바랍니다.`,
    type: '긴급',
    priority: '높음',
    category: '안전',
    author: '본사 운영팀',
    receivedDate: '2024-01-03',
    isRead: true,
    readDate: '2024-01-03 09:15',
    hasAttachment: true,
    attachments: ['위생관리_체크리스트.pdf'],
    isImportant: true,
  },
  {
    id: 3,
    title: '신입 직원 교육 프로그램 안내',
    content: `신입 직원을 위한 온라인 교육 프로그램이 준비되었습니다.

교육 과정:
1. 브랜드 소개 (30분)
2. 서비스 매뉴얼 (45분)
3. 위생 관리 (30분)
4. POS 시스템 사용법 (60분)

교육 완료 후 수료증이 발급됩니다.`,
    type: '교육',
    priority: '보통',
    category: '교육',
    author: '본사 인사팀',
    receivedDate: '2024-01-05',
    isRead: false,
    readDate: null,
    hasAttachment: false,
    attachments: [],
    isImportant: false,
  },
  {
    id: 4,
    title: '매장 청소 및 방역 안내',
    content: `코로나19 재확산에 따른 매장 청소 및 방역 강화 안내입니다.

강화 조치:
1. 테이블 소독 주기 단축
2. 출입구 손소독제 비치
3. 직원 마스크 착용 의무화
4. 매일 방역 일지 작성

고객과 직원의 안전을 위해 철저히 준수해주시기 바랍니다.`,
    type: '일반',
    priority: '높음',
    category: '운영',
    author: '본사 운영팀',
    receivedDate: '2024-01-02',
    isRead: true,
    readDate: '2024-01-02 16:20',
    hasAttachment: false,
    attachments: [],
    isImportant: true,
  },
  {
    id: 5,
    title: '월말 정산 시스템 점검 안내',
    content: `월말 정산 시스템 점검으로 인한 일시적 서비스 중단 안내입니다.

점검 일시: 2024년 1월 31일 23:00 ~ 2024년 2월 1일 06:00
영향 서비스: 
- POS 시스템 정산 기능
- 온라인 리포트 조회
- 매출 데이터 동기화

점검 시간 동안 수동 정산을 준비해주시기 바랍니다.`,
    type: '일반',
    priority: '보통',
    category: 'IT',
    author: '본사 IT팀',
    receivedDate: '2023-12-31',
    isRead: true,
    readDate: '2023-12-31 10:45',
    hasAttachment: false,
    attachments: [],
    isImportant: false,
  },
  {
    id: 6,
    title: '2024년 설 연휴 운영시간 변경 안내',
    content: `설 연휴 기간 중 운영시간이 변경됩니다.

운영시간 변경:
- 2월 9일(금): 오전 11:00 ~ 오후 8:00 (2시간 단축)
- 2월 10일(토): 휴무
- 2월 11일(일): 휴무  
- 2월 12일(월): 오후 2:00 ~ 오후 10:00

연휴 기간 매출 손실을 최소화하기 위해 배달 서비스를 강화하시기 바랍니다.`,
    type: '일반',
    priority: '보통',
    category: '운영',
    author: '본사 운영팀',
    receivedDate: '2024-01-15',
    isRead: false,
    readDate: null,
    hasAttachment: false,
    attachments: [],
    isImportant: false,
  },
  {
    id: 7,
    title: '긴급: 원재료 가격 인상에 따른 메뉴가 조정',
    content: `원재료 가격 인상으로 인한 메뉴 가격 조정이 필요합니다.

조정 내용:
- 치킨버거: 8,500원 → 9,000원 (+500원)
- 불고기버거: 9,000원 → 9,500원 (+500원)
- 감자튀김: 3,000원 → 3,200원 (+200원)
- 음료류: 기존 가격 유지

적용일: 2024년 2월 1일부터
POS 시스템 가격 업데이트는 자동으로 적용됩니다.`,
    type: '긴급',
    priority: '높음',
    category: '메뉴',
    author: '본사 기획팀',
    receivedDate: '2024-01-25',
    isRead: true,
    readDate: '2024-01-25 10:15',
    hasAttachment: true,
    attachments: ['가격표_업데이트.pdf'],
    isImportant: true,
  },
  {
    id: 8,
    title: '직원 복리후생 제도 개선 안내',
    content: `직원 복리후생 제도가 개선되어 안내드립니다.

개선 내용:
1. 식대 지원 확대: 월 10만원 → 15만원
2. 교육비 지원: 연간 50만원 한도
3. 건강검진 지원: 연 1회 종합검진
4. 장기근속 포상제도 신설

새로운 제도는 3월부터 적용되며, 자세한 신청 방법은 첨부 파일을 참고하시기 바랍니다.`,
    type: '일반',
    priority: '보통',
    category: '인사',
    author: '본사 인사팀',
    receivedDate: '2024-01-20',
    isRead: false,
    readDate: null,
    hasAttachment: true,
    attachments: ['복리후생_신청서.docx', '제도_상세안내.pdf'],
    isImportant: false,
  },
  {
    id: 9,
    title: '매장 인테리어 리뉴얼 지원 프로그램',
    content: `매장 경쟁력 강화를 위한 인테리어 리뉴얼 지원 프로그램을 시작합니다.

지원 내용:
- 지원 금액: 최대 500만원 (매장당)
- 지원 대상: 개점 3년 이상 매장
- 신청 기간: 2024년 3월 1일 ~ 4월 30일
- 공사 기간: 2024년 5월 ~ 8월

신청을 희망하는 가맹점은 첨부된 신청서를 작성하여 제출해주시기 바랍니다.`,
    type: '일반',
    priority: '보통',
    category: '지원',
    author: '본사 시설팀',
    receivedDate: '2024-02-01',
    isRead: false,
    readDate: null,
    hasAttachment: true,
    attachments: ['리뉴얼_신청서.pdf', '디자인_가이드라인.pdf'],
    isImportant: false,
  },
  {
    id: 10,
    title: '여름 시즌 프로모션 기획안',
    content: `2024년 여름 시즌 프로모션 기획안을 공유합니다.

프로모션 개요:
1. 아이스 음료 50% 할인 (7월 한정)
2. 세트메뉴 구매 시 디저트 무료 증정
3. SNS 이벤트: 매장 사진 업로드 시 쿠폰 제공
4. 배달 주문 시 무료 배송 (3만원 이상)

각 가맹점에서는 지역 특성에 맞게 추가 이벤트를 기획하여 매출 증대에 힘써주시기 바랍니다.`,
    type: '일반',
    priority: '보통',
    category: '마케팅',
    author: '본사 마케팅팀',
    receivedDate: '2024-01-28',
    isRead: true,
    readDate: '2024-01-28 15:30',
    hasAttachment: true,
    attachments: ['프로모션_상세계획.pptx'],
    isImportant: false,
  },
  {
    id: 11,
    title: '긴급: 배달앱 수수료 정책 변경',
    content: `주요 배달앱의 수수료 정책이 변경되어 긴급 안내드립니다.

변경 내용:
- 배달의민족: 기존 8.8% → 9.2% (0.4%p 인상)
- 요기요: 기존 8.5% → 8.8% (0.3%p 인상)
- 쿠팡이츠: 기존 9.8% → 10.2% (0.4%p 인상)

적용일: 2024년 3월 1일부터
수수료 인상에 따른 가격 재검토가 필요하니, 수익성 분석을 진행해주시기 바랍니다.`,
    type: '긴급',
    priority: '높음',
    category: '운영',
    author: '본사 운영팀',
    receivedDate: '2024-02-15',
    isRead: false,
    readDate: null,
    hasAttachment: false,
    attachments: [],
    isImportant: true,
  },
  {
    id: 12,
    title: '친환경 포장재 도입 안내',
    content: `환경보호를 위한 친환경 포장재 도입을 안내드립니다.

도입 품목:
1. 생분해 플라스틱 용기 (테이크아웃용)
2. 종이 빨대 (플라스틱 빨대 대체)
3. 재생지 쇼핑백
4. 친환경 포장 테이프

도입 시기: 2024년 4월부터 단계적 적용
기존 재고 소진 후 순차 교체 예정이며, 추가 비용은 본사에서 지원합니다.`,
    type: '일반',
    priority: '보통',
    category: '운영',
    author: '본사 구매팀',
    receivedDate: '2024-02-10',
    isRead: true,
    readDate: '2024-02-10 11:20',
    hasAttachment: true,
    attachments: ['친환경포장재_카탈로그.pdf'],
    isImportant: false,
  }
];

// 교육 자료 데이터 (임시)
const educationMaterials = [
  {
    id: 1,
    title: '신메뉴 조리법 가이드',
    description: '2024년 1월 출시 신메뉴의 상세 조리법과 플레이팅 가이드',
    content: `신메뉴 조리법 상세 가이드

1. 매콤 치킨 버거
재료: 치킨 패티, 매콤 소스, 양상추, 토마토, 양파, 번
조리법:
- 치킨 패티를 180도에서 3분간 조리
- 매콤 소스 2스푼 발라주기
- 신선한 야채 순서대로 올리기
- 플레이팅: 사선으로 자른 후 픽으로 고정

2. 시그니처 샐러드
재료: 믹스 샐러드, 닭가슴살, 방울토마토, 견과류, 발사믹 드레싱
조리법:
- 닭가슴살을 허브와 함께 그릴에 구워주기
- 샐러드는 차가운 물에 헹군 후 물기 제거
- 모든 재료를 예쁘게 배치 후 드레싱 제공

주의사항: 모든 재료는 신선도를 유지하고, 위생 수칙을 철저히 지켜주세요.`,
    category: '메뉴',
    type: '동영상',
    duration: '15분',
    downloadCount: 45,
    rating: 4.8,
    uploadDate: '2024-01-01',
    fileSize: '125MB',
  },
  {
    id: 2,
    title: '고객 서비스 매뉴얼',
    description: '우수한 고객 서비스를 위한 응대 방법과 상황별 대처법',
    content: `고객 서비스 매뉴얼

기본 원칙:
1. 고객과 눈 맞춤하며 밝은 미소로 인사
2. 정중하고 친근한 말투 사용
3. 고객의 말을 끝까지 경청
4. 문제 해결을 위해 최선을 다하는 자세

상황별 대처법:

▶ 주문 접수 시
- "안녕하세요! 주문 도와드리겠습니다"
- 메뉴 추천 및 세트 구성 안내
- 정확한 주문 확인 후 결제 진행

▶ 컴플레인 발생 시
- 진심어린 사과 표현
- 고객의 불만을 충분히 들어주기
- 즉시 해결 방안 제시
- 매니저에게 즉시 보고

▶ 대기시간이 긴 경우
- 예상 대기시간 안내
- 음료나 간단한 서비스 제공
- 정기적으로 진행 상황 안내`,
    category: '서비스',
    type: 'PDF',
    duration: '읽기 30분',
    downloadCount: 128,
    rating: 4.9,
    uploadDate: '2023-12-15',
    fileSize: '2.5MB',
  },
  {
    id: 3,
    title: 'POS 시스템 사용법',
    description: '새로운 POS 시스템의 기본 사용법과 고급 기능 활용',
    content: `POS 시스템 사용법

▶ 기본 조작법
1. 로그인: 직원번호 + 비밀번호 입력
2. 메뉴 선택: 카테고리별로 구분된 메뉴 버튼 클릭
3. 옵션 추가: 사이드 메뉴, 음료 업그레이드 등
4. 할인 적용: 쿠폰, 멤버십 할인 등

▶ 결제 처리
- 현금 결제: 받은 금액 입력 → 거스름돈 자동 계산
- 카드 결제: 결제 방식 선택 → 카드 리더기 사용
- 간편결제: QR코드 스캔 또는 NFC 터치

▶ 일일 정산
1. 매출 현황 조회 (실시간)
2. 시간대별 매출 분석
3. 메뉴별 판매 현황
4. 할인 내역 및 쿠폰 사용량
5. 일일 마감 처리

▶ 문제 해결
- 시스템 오류 시: 재부팅 후 고객센터 연락
- 결제 오류 시: 수동 결제 후 별도 기록
- 네트워크 오류 시: 오프라인 모드 사용`,
    category: 'IT',
    type: '동영상',
    duration: '25분',
    downloadCount: 89,
    rating: 4.6,
    uploadDate: '2023-12-20',
    fileSize: '200MB',
  },
  {
    id: 4,
    title: '위생 관리 체크리스트',
    description: '매일 확인해야 할 위생 관리 항목과 점검 방법',
    content: `위생 관리 체크리스트

▶ 개인 위생
□ 출근 시 체온 측정 및 건강상태 확인
□ 손 씻기 및 손소독제 사용 (30초 이상)
□ 위생모, 위생복, 위생장갑 착용
□ 개인 소지품은 지정된 장소에 보관

▶ 조리 전 점검사항
□ 냉장/냉동고 온도 확인 (냉장 0~4도, 냉동 -18도 이하)
□ 식재료 유통기한 확인
□ 조리 기구 세척 및 소독 상태 확인
□ 작업대 청소 및 소독

▶ 조리 중 위생관리
□ 생식재료와 조리된 음식 분리 보관
□ 조리 온도 확인 (중심온도 75도 이상)
□ 2시간 이상 상온 방치 금지
□ 교차오염 방지를 위한 기구 분리 사용

▶ 매장 청결 관리
□ 테이블 및 의자 소독 (고객 이용 후 매번)
□ 바닥 청소 (2시간마다)
□ 화장실 점검 및 청소 (1시간마다)
□ 쓰레기통 비우기 및 소독

▶ 마감 시 청소
□ 모든 조리기구 분해 세척
□ 냉장고 내부 청소 및 정리
□ 환풍기 및 후드 청소
□ 전체 바닥 및 벽면 청소`,
    category: '안전',
    type: 'PDF',
    duration: '읽기 10분',
    downloadCount: 156,
    rating: 5.0,
    uploadDate: '2024-01-03',
    fileSize: '1.8MB',
  },
  {
    id: 5,
    title: '신입직원 오리엔테이션 가이드',
    description: '신입직원의 빠른 적응을 위한 단계별 교육 프로그램',
    content: `신입직원 오리엔테이션 가이드

▶ 1주차: 기본 교육
1일차: 회사 소개 및 브랜드 이해
- 회사 역사 및 비전
- 브랜드 정체성과 핵심가치
- 조직도 및 업무 분장

2-3일차: 기본 업무 교육
- 매장 시설 및 장비 사용법
- 기본 위생 수칙
- 고객 응대 기본 매뉴얼

4-5일차: 실무 교육 (멘토와 함께)
- 주문 접수 및 서빙 실습
- POS 시스템 사용법
- 청소 및 정리 업무

▶ 2주차: 심화 교육
- 메뉴 상세 정보 및 조리법
- 상황별 고객 응대법
- 매장 운영 규칙 및 정책

▶ 1개월 후: 평가 및 피드백
- 업무 숙련도 평가
- 고객 서비스 역량 점검
- 개선 사항 및 추가 교육 계획`,
    category: '교육',
    type: '동영상',
    duration: '45분',
    downloadCount: 67,
    rating: 4.7,
    uploadDate: '2024-01-10',
    fileSize: '310MB',
  },
  {
    id: 6,
    title: '재고 관리 시스템 매뉴얼',
    description: '효율적인 재고 관리를 위한 시스템 사용법과 관리 포인트',
    content: `재고 관리 시스템 매뉴얼

▶ 입고 관리
1. 납품 확인
- 주문서와 납품서 대조
- 수량 및 품질 확인
- 유통기한 및 상태 점검

2. 시스템 입력
- 품목별 수량 정확히 입력
- 유통기한 정보 등록
- 입고 위치 지정

▶ 출고 관리
- 선입선출 원칙 준수
- 출고 시 시스템에 즉시 반영
- 폐기 시 폐기 처리 등록

▶ 재고 조사
- 매주 정기 재고 조사
- 실물과 시스템 재고 대조
- 차이 발생 시 원인 분석 및 조치

▶ 발주 관리
- 안전재고 기준 설정
- 자동 발주 알림 확인
- 납품업체별 발주 일정 관리`,
    category: '운영',
    type: 'PDF',
    duration: '읽기 20분',
    downloadCount: 92,
    rating: 4.5,
    uploadDate: '2024-01-15',
    fileSize: '4.2MB',
  },
  {
    id: 7,
    title: '매장 마케팅 활동 가이드',
    description: '지역 특성을 활용한 효과적인 매장 마케팅 전략 수립 방법',
    content: `매장 마케팅 활동 가이드

▶ SNS 마케팅
1. 인스타그램 운영
- 매일 1회 이상 포스팅
- 음식 사진은 자연광에서 촬영
- 해시태그 적극 활용 (#지역명 #매장명 등)
- 고객 후기 리포스트

2. 페이스북 페이지 관리
- 매장 정보 정확히 업데이트
- 이벤트 및 프로모션 안내
- 고객 문의 빠른 응답

▶ 오프라인 마케팅
1. 전단지 배포
- 점심/저녁 시간대 집중 배포
- 주변 오피스, 학교 타겟팅
- 할인 쿠폰 포함

2. 지역 상권 네트워킹
- 상인회 적극 참여
- 주변 상점과 상생 이벤트
- 지역 축제 참가

▶ 고객 관계 관리
- 단골고객 리워드 프로그램
- 생일 할인 서비스
- 피드백 적극 수렴 및 개선`,
    category: '마케팅',
    type: '동영상',
    duration: '35분',
    downloadCount: 73,
    rating: 4.6,
    uploadDate: '2024-01-18',
    fileSize: '280MB',
  },
  {
    id: 8,
    title: '응급상황 대응 매뉴얼',
    description: '화재, 의료응급상황 등 다양한 응급상황 발생 시 대응 절차',
    content: `응급상황 대응 매뉴얼

▶ 화재 발생 시
1. 즉시 대응
- "불이야!" 큰 소리로 외치기
- 가스 밸브 차단
- 소화기 사용 (초기 진화 가능 시)

2. 대피 및 신고
- 고객 안전 대피 유도
- 119 신고
- 본사 긴급연락처 신고

▶ 의료 응급상황
1. 고객 응급상황
- 119 즉시 신고
- 응급처치 실시 (교육받은 범위 내)
- 고객 보호자 연락

2. 직원 응급상황
- 안전한 곳으로 이동
- 응급처치 및 119 신고
- 매니저 및 본사 보고

▶ 식중독 의심 시
- 의심 메뉴 즉시 판매 중단
- 관련 재료 보존 처리
- 보건소 및 본사 신고
- 고객 대응 및 후속 조치

▶ 응급연락처
- 화재/의료응급: 119
- 경찰: 112
- 본사 24시간 상황실: 1588-0000`,
    category: '안전',
    type: 'PDF',
    duration: '읽기 15분',
    downloadCount: 134,
    rating: 4.9,
    uploadDate: '2024-01-22',
    fileSize: '3.1MB',
  },
  {
    id: 9,
    title: '배달 서비스 운영 가이드',
    description: '배달앱 연동 및 배달 서비스 품질 관리 방안',
    content: `배달 서비스 운영 가이드

▶ 배달앱 관리
1. 주문 접수 관리
- 주문 알림 즉시 확인 (3분 이내)
- 조리 시간 정확히 설정
- 품절 메뉴 실시간 업데이트

2. 메뉴 관리
- 사진 품질 관리 (고해상도)
- 메뉴 설명 상세 작성
- 가격 정보 정확히 입력

▶ 포장 및 배달 준비
1. 포장 원칙
- 국물이 새지 않도록 밀폐 포장
- 뜨거운 음식과 차가운 음식 분리
- 소스류는 별도 포장

2. 배달 품질 관리
- 배달 시간 준수 (약속 시간 ±5분)
- 음식 온도 유지
- 포장 상태 최종 점검

▶ 고객 응대
- 배달 문의 친절 응답
- 지연 시 사전 안내
- 문제 발생 시 즉시 해결 방안 제시`,
    category: '서비스',
    type: '동영상',
    duration: '30분',
    downloadCount: 108,
    rating: 4.4,
    uploadDate: '2024-01-25',
    fileSize: '250MB',
  },
  {
    id: 10,
    title: '매출 분석 및 개선 방안',
    description: 'POS 데이터를 활용한 매출 분석 방법과 개선 전략 수립',
    content: `매출 분석 및 개선 방안

▶ 기본 분석 지표
1. 일별 매출 분석
- 요일별 매출 패턴 파악
- 시간대별 매출 분포
- 날씨와 매출 상관관계

2. 메뉴별 분석
- 인기 메뉴 TOP 10
- 수익성 높은 메뉴 파악
- 느린 회전 메뉴 식별

▶ 고객 분석
1. 고객 유형 분석
- 연령대별 선호 메뉴
- 재방문 고객 비율
- 신규 고객 유입 경로

2. 주문 패턴 분석
- 평균 주문 금액
- 세트메뉴 vs 단품 비율
- 추가 주문율

▶ 개선 방안 수립
1. 매출 증대 전략
- 저조 시간대 프로모션
- 고수익 메뉴 마케팅 강화
- 고객 재방문 유도 방안

2. 비용 절감 방안
- 느린 회전 재료 사용 메뉴 개발
- 인건비 효율화
- 에너지 비용 절약`,
    category: '운영',
    type: 'PDF',
    duration: '읽기 25분',
    downloadCount: 89,
    rating: 4.8,
    uploadDate: '2024-01-30',
    fileSize: '5.3MB',
  },
];

export function NoticeEducation() {
  const [notices, setNotices] = useState(receivedNotices);
  const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [showNoticeDetail, setShowNoticeDetail] = useState(false);
  const [selectedEducation, setSelectedEducation] = useState<any>(null);
  const [showEducationDetail, setShowEducationDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterRead, setFilterRead] = useState('all');

  const noticeColumns = [
    {
      key: 'status',
      label: '상태',
      render: (value: any, notice: any) => (
        <div className="flex items-center gap-2">
          {!notice?.isRead && <div className="w-2 h-2 bg-kpi-red rounded-full"></div>}
          {notice?.isImportant && <Star className="w-4 h-4 text-yellow-500" />}
          {notice?.type === '긴급' && <AlertTriangle className="w-4 h-4 text-red-500" />}
        </div>
      ),
    },
    {
      key: 'title',
      label: '제목',
      render: (value: any, notice: any) => (
        <div className="max-w-xs">
          <div className="flex items-center gap-2 mb-1">
            <span 
              className={`font-medium truncate cursor-pointer hover:text-blue-600 ${
                !notice?.isRead ? 'font-semibold' : ''
              }`}
              onClick={() => handleViewNotice(notice)}
            >
              {notice?.title}
            </span>
            {notice?.hasAttachment && <Paperclip className="w-3 h-3 text-gray-400" />}
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`text-xs ${
                notice.type === '긴급' ? 'border-red-200 text-red-700' :
                notice.type === '교육' ? 'border-blue-200 text-blue-700' :
                'border-gray-200 text-gray-700'
              }`}
            >
              {notice.type}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {notice.category}
            </Badge>
          </div>
        </div>
      ),
    },
    {
      key: 'author',
      label: '발송자',
      render: (value: any, notice: any) => (
        <div className="text-xs">
          <div className="font-medium flex items-center gap-1">
            <User className="w-3 h-3" />
            {notice.author}
          </div>
        </div>
      ),
    },
    {
      key: 'receivedDate',
      label: '수신일',
      render: (value: any, notice: any) => (
        <div className="text-xs flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {notice.receivedDate}
        </div>
      ),
    },
    {
      key: 'readStatus',
      label: '읽음',
      render: (value: any, notice: any) => (
        <div className="flex items-center gap-1">
          {notice?.isRead ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs text-gray-600">{notice?.readDate}</span>
            </>
          ) : (
            <span className="text-xs text-gray-500">미읽음</span>
          )}
        </div>
      ),
    },
  ];

  const educationColumns = [
    {
      key: 'title',
      label: '제목',
      render: (value: any, material: any) => (
        <div>
          <div 
            className="font-medium cursor-pointer hover:text-blue-600"
            onClick={() => handleViewEducation(material)}
          >
            {material.title}
          </div>
          <div className="text-xs text-gray-500 mt-1">{material.description}</div>
        </div>
      ),
    },
    {
      key: 'category',
      label: '분류',
      render: (value: any, material: any) => (
        <Badge variant="outline" className="text-xs">
          {material.category}
        </Badge>
      ),
    },
    {
      key: 'uploadDate',
      label: '업로드일',
      render: (value: any, material: any) => (
        <div className="flex items-center gap-1 text-xs">
          <Calendar className="w-3 h-3" />
          {material.uploadDate}
        </div>
      ),
    },
    {
      key: 'actions',
      label: '다운로드',
      render: (value: any, material: any) => (
        <DownloadToggle
          onDownload={(format) => handleEducationDownload(material, format)}
          filename={`교육자료_${material.title}`}
        />
      ),
    },
  ];

  const handleViewNotice = (notice: any) => {
    if (!notice.isRead) {
      // 읽음 처리
      setNotices(notices.map(n => 
        n.id === notice.id 
          ? { ...n, isRead: true, readDate: new Date().toLocaleString('ko-KR') }
          : n
      ));
    }
    setSelectedNotice(notice);
    setShowNoticeDetail(true);
  };

  const handleViewEducation = (material: any) => {
    setSelectedEducation(material);
    setShowEducationDetail(true);
  };

  const handleEducationDownload = async (material: any, format: 'excel' | 'pdf') => {
    try {
      // 파일 생성 시뮬레이션을 위한 지연
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (format === 'excel') {
        // 엑셀 다운로드 - 교육자료 정보를 CSV로 내보내기
        const exportData = [{
          제목: material.title || '-',
          설명: material.description || '-',
          분류: material.category || '-',
          파일크기: material.fileSize || '-',
          업로드일: material.uploadDate || '-',
          다운로드수: material.downloadCount ? `${material.downloadCount}회` : '0회'
        }];

        const csvContent = [
          Object.keys(exportData[0]).join(','),
          ...exportData.map(row => Object.values(row).map(v => `"${v}"`).join(','))
        ].join('\n');
        
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `교육자료_${material.title}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
      } else {
        // PDF 다운로드 - HTML 보고서 생성 (인쇄용)
        const reportWindow = window.open('', '_blank');
        const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>교육자료 - ${material.title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
            padding: 40px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #14213D;
            padding-bottom: 20px;
        }
        
        .header h1 {
            color: #14213D;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .header-info {
            color: #666;
            font-size: 14px;
        }
        
        .content-section {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            margin-bottom: 30px;
        }
        
        .section-header {
            background: linear-gradient(135deg, #14213D 0%, #1a2b4d 100%);
            color: white;
            padding: 16px 20px;
            font-weight: 600;
            font-size: 16px;
        }
        
        .section-content {
            padding: 20px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .info-item {
            display: flex;
            flex-direction: column;
        }
        
        .info-label {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
            font-weight: 500;
        }
        
        .info-value {
            font-size: 14px;
            color: #333;
            font-weight: 500;
        }
        
        .description-section {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #06D6A0;
        }
        
        .description-label {
            font-size: 12px;
            color: #666;
            font-weight: 600;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        
        .description-content {
            font-size: 14px;
            color: #333;
            line-height: 1.5;
        }
        
        .content-section-full {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #9D4EDD;
            margin-top: 20px;
        }
        
        .content-title {
            font-size: 14px;
            color: #666;
            font-weight: 600;
            margin-bottom: 12px;
            text-transform: uppercase;
        }
        
        .content-text {
            font-size: 14px;
            color: #333;
            line-height: 1.6;
            white-space: pre-line;
        }
        
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
        
        @media print {
            body { padding: 20px; }
            .content-section { break-inside: avoid; }
            .header { break-after: avoid; }
        }
        
        @page {
            margin: 2cm;
            size: A4;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📚 교육자료</h1>
        <div class="header-info">
            <div>${material.title}</div>
            <div>생성일시: ${new Date().toLocaleString('ko-KR')}</div>
        </div>
    </div>
    
    <div class="content-section">
        <div class="section-header">
            📋 교육자료 정보
        </div>
        <div class="section-content">
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">제목</div>
                    <div class="info-value">${material.title}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">분류</div>
                    <div class="info-value">${material.category}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">파일 크기</div>
                    <div class="info-value">${material.fileSize}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">업로드일</div>
                    <div class="info-value">${material.uploadDate}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">다운로드 수</div>
                    <div class="info-value">${material.downloadCount}회</div>
                </div>
            </div>
            <div class="description-section">
                <div class="description-label">설명</div>
                <div class="description-content">${material.description}</div>
            </div>
        </div>
    </div>
    
    <div class="content-section-full">
        <div class="content-title">교육 내용</div>
        <div class="content-text">${material.content}</div>
    </div>
    
    <div class="footer">
        <div>FranFriend ERP System - 교육자료 관리</div>
        <div>본 보고서는 ${new Date().toLocaleString('ko-KR')}에 자동 생성되었습니다.</div>
    </div>
    
    <script>
        // 페이지 로드 후 자동 인쇄 다이얼로그 표시
        window.onload = function() {
            setTimeout(() => {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>`;
        
        if (reportWindow) {
          reportWindow.document.write(htmlContent);
          reportWindow.document.close();
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  };

  // 첨부파일 다운로드 함수 (공지사항용)
  const handleAttachmentDownload = async (attachment: string, format: 'excel' | 'pdf') => {
    try {
      // 파일 생성 시뮬레이션을 위한 지연
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (format === 'excel') {
        // 엑셀 다운로드 - 첨부파일 정보를 CSV로 내보내기
        const exportData = [{
          첨부파일명: attachment || '-',
          공지제목: selectedNotice?.title || '-',
          발송자: selectedNotice?.author || '-',
          수신일: selectedNotice?.receivedDate || '-',
          분류: selectedNotice?.category || '-',
          다운로드일시: new Date().toLocaleString('ko-KR')
        }];

        const csvContent = [
          Object.keys(exportData[0]).join(','),
          ...exportData.map(row => Object.values(row).map(v => `"${v}"`).join(','))
        ].join('\n');
        
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `첨부파일_${attachment}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
      } else {
        // PDF 다운로드 - HTML 보고서 생성 (인쇄용)
        const reportWindow = window.open('', '_blank');
        const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>첨부파일 - ${attachment}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
            padding: 40px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #14213D;
            padding-bottom: 20px;
        }
        
        .header h1 {
            color: #14213D;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .header-info {
            color: #666;
            font-size: 14px;
        }
        
        .content-section {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            margin-bottom: 30px;
        }
        
        .section-header {
            background: linear-gradient(135deg, #14213D 0%, #1a2b4d 100%);
            color: white;
            padding: 16px 20px;
            font-weight: 600;
            font-size: 16px;
        }
        
        .section-content {
            padding: 20px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .info-item {
            display: flex;
            flex-direction: column;
        }
        
        .info-label {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
            font-weight: 500;
        }
        
        .info-value {
            font-size: 14px;
            color: #333;
            font-weight: 500;
        }
        
        .content-section-full {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #FF6B6B;
            margin-top: 20px;
        }
        
        .content-title {
            font-size: 14px;
            color: #666;
            font-weight: 600;
            margin-bottom: 12px;
            text-transform: uppercase;
        }
        
        .content-text {
            font-size: 14px;
            color: #333;
            line-height: 1.6;
            white-space: pre-line;
        }
        
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
        
        @media print {
            body { padding: 20px; }
            .content-section { break-inside: avoid; }
            .header { break-after: avoid; }
        }
        
        @page {
            margin: 2cm;
            size: A4;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📎 첨부파일</h1>
        <div class="header-info">
            <div>${attachment}</div>
            <div>다운로드일시: ${new Date().toLocaleString('ko-KR')}</div>
        </div>
    </div>
    
    <div class="content-section">
        <div class="section-header">
            📋 첨부파일 정보
        </div>
        <div class="section-content">
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">파일명</div>
                    <div class="info-value">${attachment}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">관련 공지</div>
                    <div class="info-value">${selectedNotice?.title}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">발송자</div>
                    <div class="info-value">${selectedNotice?.author}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">수신일</div>
                    <div class="info-value">${selectedNotice?.receivedDate}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">분류</div>
                    <div class="info-value">${selectedNotice?.category}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">다운로드일시</div>
                    <div class="info-value">${new Date().toLocaleString('ko-KR')}</div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="content-section-full">
        <div class="content-title">공지 내용</div>
        <div class="content-text">${selectedNotice?.content}</div>
    </div>
    
    <div class="footer">
        <div>FranFriend ERP System - 공지사항 첨부파일</div>
        <div>본 보고서는 ${new Date().toLocaleString('ko-KR')}에 자동 생성되었습니다.</div>
    </div>
    
    <script>
        // 페이지 로드 후 자동 인쇄 다이얼로그 표시
        window.onload = function() {
            setTimeout(() => {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>`;
        
        if (reportWindow) {
          reportWindow.document.write(htmlContent);
          reportWindow.document.close();
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  };

  const handleMarkImportant = (notice: any) => {
    setNotices(notices.map(n => 
      n.id === notice.id 
        ? { ...n, isImportant: !n.isImportant }
        : n
    ));
    toast.success(notice.isImportant ? '중요 표시가 해제되었습니다.' : '중요 표시가 설정되었습니다.');
  };

  // 필터링된 공지사항 데이터
  const filteredNotices = notices.filter(notice => {
    const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notice.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notice.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || notice.type === filterType;
    const matchesRead = filterRead === 'all' || 
                       (filterRead === 'read' && notice.isRead) ||
                       (filterRead === 'unread' && !notice.isRead);
    
    return matchesSearch && matchesType && matchesRead;
  });

  // 통계 계산
  const totalNotices = notices.length;
  const unreadNotices = notices.filter(n => !n.isRead).length;
  const importantNotices = notices.filter(n => n.isImportant).length;
  const urgentNotices = notices.filter(n => n.type === '긴급').length;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">공지/교육</h1>
          <p className="text-sm text-gray-600 mt-1">본사에서 발송한 공지사항과 교육자료를 확인합니다</p>
        </div>
      </div>

      {/* KPI 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="전체 공지"
          value={`${totalNotices}건`}
          icon={MessageSquare}
          color="red"
          trend={+8.3}
        />
        <KPICard
          title="읽지 않음"
          value={`${unreadNotices}건`}
          icon={Bell}
          color="orange"
          trend={-12.5}
        />
        <KPICard
          title="중요 공지"
          value={`${importantNotices}건`}
          icon={Star}
          color="green"
          trend={+5.7}
        />
        <KPICard
          title="긴급 공지"
          value={`${urgentNotices}건`}
          icon={AlertTriangle}
          color="purple"
          trend={0}
        />
      </div>

      <Tabs defaultValue="notices" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notices">공지사항</TabsTrigger>
          <TabsTrigger value="education">교육자료</TabsTrigger>
        </TabsList>

        <TabsContent value="notices" className="space-y-4">
          {/* 검색 및 필터 */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="제목, 내용, 발송자로 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="all">전체 유형</option>
                    <option value="일반">일반</option>
                    <option value="긴급">긴급</option>
                    <option value="교육">교육</option>
                  </select>
                  <select
                    value={filterRead}
                    onChange={(e) => setFilterRead(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="all">전체</option>
                    <option value="unread">읽지 않음</option>
                    <option value="read">읽음</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 공지사항 목록 테이블 */}
          <DataTable
            data={filteredNotices}
            columns={noticeColumns}
            title={`공지사항 (${filteredNotices.length}건, 미읽음 ${unreadNotices}건)`}
            hideSearch={true}
            showActions={false}
          />
        </TabsContent>

        <TabsContent value="education" className="space-y-6">
          {/* 교육자료 목록 */}
          <DataTable
            data={educationMaterials}
            columns={educationColumns}
            title={`교육자료 (${educationMaterials.length}개)`}
            showActions={false}
          />
        </TabsContent>
      </Tabs>

      {/* 공지사항 상세 모달 */}
      <Dialog open={showNoticeDetail} onOpenChange={setShowNoticeDetail}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-xl pr-4">{selectedNotice?.title}</DialogTitle>
                <DialogDescription className="mt-1">
                  {selectedNotice?.author}에서 발송한 {selectedNotice?.type} 공지사항입니다.
                </DialogDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      selectedNotice?.type === '긴급' ? 'border-red-200 text-red-700' :
                      selectedNotice?.type === '교육' ? 'border-blue-200 text-blue-700' :
                      'border-gray-200 text-gray-700'
                    }`}
                  >
                    {selectedNotice?.type}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {selectedNotice?.category}
                  </Badge>
                  {selectedNotice?.priority === '높음' && (
                    <Badge className="bg-red-100 text-red-700 text-xs">
                      높은 우선순위
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkImportant(selectedNotice)}
                >
                  <Star 
                    className={`w-4 h-4 ${
                      selectedNotice?.isImportant ? 'text-yellow-500 fill-current' : ''
                    }`} 
                  />
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border-b pb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">발송자:</span>
                  <span className="ml-2 font-medium">{selectedNotice?.author}</span>
                </div>
                <div>
                  <span className="text-gray-600">수신일:</span>
                  <span className="ml-2">{selectedNotice?.receivedDate}</span>
                </div>
              </div>
            </div>
            
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {selectedNotice?.content}
              </pre>
            </div>
            
            {selectedNotice?.hasAttachment && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  첨부파일
                </h4>
                <div className="space-y-2">
                  {selectedNotice?.attachments?.map((file: string, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{file}</span>
                      <DownloadToggle
                        onDownload={(format) => handleAttachmentDownload(file, format)}
                        filename={file}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 교육자료 상세 모달 */}
      <Dialog open={showEducationDetail} onOpenChange={setShowEducationDetail}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-xl pr-4">{selectedEducation?.title}</DialogTitle>
                <DialogDescription className="mt-1">
                  {selectedEducation?.description}
                </DialogDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {selectedEducation?.category}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {selectedEducation?.type}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-xs">{selectedEducation?.rating}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <DownloadToggle
                  onDownload={(format) => handleEducationDownload(selectedEducation, format)}
                  filename={`교육자료_${selectedEducation?.title}`}
                />
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border-b pb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">소요시간:</span>
                  <span className="ml-2 font-medium">{selectedEducation?.duration}</span>
                </div>
                <div>
                  <span className="text-gray-600">업로드일:</span>
                  <span className="ml-2">{selectedEducation?.uploadDate}</span>
                </div>
                <div>
                  <span className="text-gray-600">다운로드:</span>
                  <span className="ml-2">{selectedEducation?.downloadCount}회</span>
                </div>
                <div>
                  <span className="text-gray-600">파일크기:</span>
                  <span className="ml-2">{selectedEducation?.fileSize}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">설명</h4>
              <p className="text-sm text-gray-600 mb-4">{selectedEducation?.description}</p>
            </div>
            
            <div className="prose prose-sm max-w-none">
              <h4 className="font-medium mb-2">상세 내용</h4>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-gray-50 p-4 rounded">
                {selectedEducation?.content}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}