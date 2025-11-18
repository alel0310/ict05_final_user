import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { FormModal } from '../Common/FormModal';
import { ConfirmDialog } from '../Common/ConfirmDialog';
import {
  CalendarX, CalendarDays, Clock, Plus, Edit, Trash2,
  Coffee, Sun, Moon, ChevronLeft, ChevronRight,
  XCircle, AlertTriangle, Search
} from 'lucide-react';
import { toast } from 'sonner';

// ===== Types =====
type PageResponse<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
};

interface Staff {
  id: string;
  name: string;
  position: string;
  hourlyWage: number;
  monthlyWage: number;
  employmentType: '정규직' | '파트타임';
  phone: string;
  email: string;
  status: 'active' | 'inactive' | 'vacation' | 'resigned';
}

// 백엔드 AttendanceListDTO에 맞는 타입
interface AttendanceItem {
  attendanceId: number;
  attendanceWorkDate: string;        // "2025-11-25"
  attendanceCheckIn: string | null;  // "2025-11-25T09:00:00"
  attendanceCheckOut: string | null; // "2025-11-25T18:00:00"
  attendanceStatus: string;          // e.g. "WORKING", "COMPLETED"
  attendanceWorkHours: number;
  staffShiftTypeName: string | null; // 오픈/미들/마감 이름 (지금은 null일 수도)
  staffId: number;
  staffName: string;
  staffEmploymentType: string;       // "OWNER", "STAFF", "PART_TIME" 같은 값 예상
}

interface WorkSchedule {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  workType: 'open' | 'middle' | 'close' | 'A' | 'B' | 'C' | 'D' | 'vacation' | 'off' | 'custom';
  startTime: string;
  endTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  breakTime: number;
  status: 'scheduled' | 'confirmed' | 'working' | 'completed' | 'absent';
  notes?: string;
}

interface WorkTimeTemplate {
  id: string;
  name: string;
  type: 'open' | 'middle' | 'close' | 'A' | 'B' | 'C' | 'D';
  startTime: string;
  endTime: string;
  breakTime: number;
  description: string;
  employmentType: '파트타임' | '정규직';
}

interface StoreHoliday {
  id: string;
  date: string;
  name: string;
  type: 'national' | 'store' | 'special';
  description?: string;
  createdBy: string;
  createdDate: string;
}

type FieldType = 'select' | 'date' | 'time' | 'number' | 'textarea' | 'text';
type FormValue = string | number | undefined;
type FormValues = Record<string, FormValue>;

type FormField = {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: (value: unknown) => string | undefined;
};

const toFormValues = (s: WorkSchedule): FormValues => ({
  id: s.id,
  staffId: s.staffId,
  staffName: s.staffName,
  date: s.date,
  workType: s.workType,
  startTime: s.startTime,
  endTime: s.endTime,
  actualStartTime: s.actualStartTime,
  actualEndTime: s.actualEndTime,
  breakTime: s.breakTime,
  status: s.status,
  notes: s.notes,
});

// UTC 꼬임 방지용: 로컬 기준 YYYY-MM-DD
const formatDateLocal = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ===== Constants =====
const BUSINESS_HOURS = { open: '08:00', close: '22:00' };
const STAFFING_REQUIREMENTS = {
  partTime: { open: 2, middle: 2, close: 2 },
  fullTime: { minimum: 1, shifts: ['A', 'B', 'C', 'D'] as const }
};
const FULLTIME_COVERAGE = {
  A: ['open', 'middle'],
  B: ['middle', 'close'],
  C: ['middle', 'close'],
  D: ['open', 'middle']
} as const;

// ===== Helpers =====
const checkStaffingRequirements = (schedules: WorkSchedule[], date: string) => {
  const daySchedules = schedules.filter(
    s => s.date === date && s.workType !== 'vacation' && s.workType !== 'off'
  );

  const partTimeCount = {
    open: daySchedules.filter(s => s.workType === 'open').length,
    middle: daySchedules.filter(s => s.workType === 'middle').length,
    close: daySchedules.filter(s => s.workType === 'close').length
  };

  const fullTimeShifts = daySchedules
    .filter(s => ['A', 'B', 'C', 'D'].includes(s.workType))
    .map(s => s.workType as 'A' | 'B' | 'C' | 'D');

  const fullTimeCoverage = { open: 0, middle: 0, close: 0 as number };
  fullTimeShifts.forEach(shift => {
    FULLTIME_COVERAGE[shift].forEach(slot => {
      fullTimeCoverage[slot as keyof typeof fullTimeCoverage]++;
    });
  });

  const warnings: string[] = [];
  (Object.entries(STAFFING_REQUIREMENTS.partTime) as Array<
    [keyof typeof partTimeCount, number]
  >).forEach(([shift, required]) => {
    const totalCoverage = partTimeCount[shift] + fullTimeCoverage[shift];
    if (totalCoverage < required) {
      const shiftName = shift === 'open' ? '오픈' : shift === 'middle' ? '미들' : '마감';
      const shortage = required - totalCoverage;
      warnings.push(
        `${shiftName} 시간대 ${shortage}명 부족 (파트타임 ${partTimeCount[shift]}명 + 정규직커버 ${fullTimeCoverage[shift]}명 = ${totalCoverage}명, 필요 ${required}명)`
      );
    }
  });

  if (fullTimeShifts.length < STAFFING_REQUIREMENTS.fullTime.minimum) {
    warnings.push(
      `정규직 ${STAFFING_REQUIREMENTS.fullTime.minimum - fullTimeShifts.length}명 부족 (A, B, C, D 시프트 중 최소 1명 필요)`
    );
  }
  return warnings;
};

const getBusinessHours = () => BUSINESS_HOURS;

// ===== Component =====
export function StaffSchedule() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [workTimeTemplates, setWorkTimeTemplates] = useState<WorkTimeTemplate[]>([]);
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [holidays, setHolidays] = useState<StoreHoliday[]>([]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState(''); // 스케줄용 검색

  // 🔽 하루 근태 리스트 + 페이징 상태
  const [attendanceList, setAttendanceList] = useState<AttendanceItem[]>([]);
  const [attendancePage, setAttendancePage] = useState(0);
  const [attendanceTotalPages, setAttendanceTotalPages] = useState(0);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // 🔽 근태 검색 상태
  const [attendanceKeyword, setAttendanceKeyword] = useState('');
  const [attendanceSearchType, setAttendanceSearchType] =
    useState<'name' | 'id' | 'all'>('name');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState<string>('ALL');

  // 모달
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WorkSchedule | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'schedule'; id: string } | null>(
    null
  );

  useEffect(() => {
    // 날짜 바뀔 때마다 현재 검색 조건으로 다시 조회
    loadAttendance(currentDate, 0);
    setAttendancePage(0);
  }, [currentDate]);

  // 휴일 체크
  const isHoliday = (date: Date) => {
    const ds = date.toISOString().split('T')[0];
    return holidays.some(h => h.date === ds);
  };
  const getHolidayInfo = (date: Date) => {
    const ds = date.toISOString().split('T')[0];
    return holidays.find(h => h.date === ds);
  };

  // 날짜별 스케줄
  const getSchedulesForDate = (date: Date) => {
    const ds = date.toISOString().split('T')[0];
    return schedules.filter(schedule => {
      const matchesDate = schedule.date === ds;
      const matchesStaff = selectedStaff === 'all' || schedule.staffId === selectedStaff;
      const matchesSearch = schedule.staffName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesDate && matchesStaff && matchesSearch;
    });
  };

  // 아이콘/뱃지
  const getWorkTypeIcon = (workType: string) => {
    switch (workType) {
      case 'open':
        return <Sun className="w-4 h-4" />;
      case 'middle':
        return <Coffee className="w-4 h-4" />;
      case 'close':
        return <Moon className="w-4 h-4" />;
      case 'A':
      case 'B':
      case 'C':
      case 'D':
        return <Clock className="w-4 h-4" />;
      case 'vacation':
        return <CalendarDays className="w-4 h-4" />;
      case 'off':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };
  const getWorkTypeBadge = (workType: string) => {
    switch (workType) {
      case 'open':
        return <Badge className="bg-blue-100 text-blue-800">오픈</Badge>;
      case 'middle':
        return <Badge className="bg-green-100 text-green-800">미들</Badge>;
      case 'close':
        return <Badge className="bg-purple-100 text-purple-800">마감</Badge>;
      case 'A':
        return <Badge className="bg-indigo-100 text-indigo-800">A근무</Badge>;
      case 'B':
        return <Badge className="bg-indigo-100 text-indigo-800">B근무</Badge>;
      case 'C':
        return <Badge className="bg-indigo-100 text-indigo-800">C근무</Badge>;
      case 'D':
        return <Badge className="bg-indigo-100 text-indigo-800">D근무</Badge>;
      case 'vacation':
        return <Badge className="bg-yellow-100 text-yellow-800">휴가</Badge>;
      case 'off':
        return <Badge className="bg-gray-100 text-gray-800">휴무</Badge>;
      default:
        return <Badge>{workType}</Badge>;
    }
  };

  // ===== Attendance Helpers =====
  const formatTime = (dateTime: string | null | undefined) => {
    if (!dateTime) return '-';
    // "YYYY-MM-DDTHH:MM:SS" → "HH:MM"
    return dateTime.substring(11, 16);
  };

  const getAttendanceStatusBadge = (status: string) => {
    switch (status) {
      case 'NORMAL':
        return <Badge className="bg-green-100 text-green-800">정상출근</Badge>;
      case 'WORKING':
        return <Badge className="bg-green-100 text-green-800">근무중</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-gray-100 text-gray-800">완료</Badge>;
      case 'ABSENT':
        return <Badge className="bg-red-100 text-red-800">결근</Badge>;
      case 'LATE':
        return <Badge className="bg-yellow-100 text-yellow-800">지각</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEmploymentTypeLabel = (type: string) => {
    switch (type) {
      case 'OWNER':
        return '점주';
      case 'STAFF':
        return '직원';
      case 'PART_TIME':
      case 'PART_TIMER':
        return '알바';
      default:
        return type;
    }
  };

  // 백엔드 근태 API 호출
  const loadAttendance = async (targetDate: Date, page: number = 0) => {
    try {
      setAttendanceLoading(true);

      const baseUrl = import.meta.env.VITE_BACKEND_API_BASE_URL;
      const token = localStorage.getItem('accessToken');
      const dateStr = formatDateLocal(targetDate);

      const res = await axios.get<PageResponse<AttendanceItem>>(
        `${baseUrl}/api/attendance/daily`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            date: dateStr,
            page,
            size: 20,
            keyword: attendanceKeyword || undefined,
            type: attendanceSearchType,
            // "ALL" 은 필터 없음 → 파라미터 안 보냄
            attendanceStatus:
              attendanceStatusFilter === 'ALL'
                ? undefined
                : attendanceStatusFilter,
          },
        }
      );

      const data = res.data;
      console.log('📌 근태 응답', data);

      setAttendanceList(data.content || []);
      setAttendancePage(data.number ?? 0);
      setAttendanceTotalPages(data.totalPages ?? 0);
    } catch (err) {
      console.error(err);
      toast.error('근태 데이터를 불러오지 못했습니다.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline">예정</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-800">확정</Badge>;
      case 'working':
        return <Badge className="bg-green-100 text-green-800">근무중</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800">완료</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800">결근</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // 근무/급여 계산
  const calculateWorkHours = (schedule: WorkSchedule) => {
    if (!schedule.actualStartTime || !schedule.actualEndTime) return 0;
    const start = new Date(`2024-01-01 ${schedule.actualStartTime}`);
    const end0 = new Date(`2024-01-01 ${schedule.actualEndTime}`);
    const end = end0 < start ? new Date(end0.getTime() + 24 * 3600 * 1000) : end0;
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const breakHours = schedule.breakTime / 60;
    return Math.max(0, diffHours - breakHours);
  };
  const calculatePay = (schedule: WorkSchedule) => {
    const staff = staffList.find(s => s.id === schedule.staffId);
    if (!staff || schedule.status !== 'completed') return 0;
    return Math.round(calculateWorkHours(schedule) * staff.hourlyWage);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // 폼용 선택 상태
  const [selectedStaffForForm, setSelectedStaffForForm] = useState<string>('');
  const [selectedWorkType, setSelectedWorkType] = useState<string>('');

  // ===== Form 정의 =====
  const scheduleFormFields = useMemo(() => {
    const getFields = (selectedStaffId: string, workType?: string): FormField[] => {
      const sel = staffList.find(s => s.id === selectedStaffId);
      const isPartTime = sel?.employmentType === '파트타임';

      const availableTemplates = workTimeTemplates.filter(
        t => t.employmentType === sel?.employmentType
      );
      const workTypeOptions: { value: string; label: string }[] = [
        ...availableTemplates.map(t => ({ value: t.type, label: t.name })),
        { value: 'vacation', label: '휴가' },
        { value: 'off', label: '휴무' }
      ];
      if (!isPartTime && sel) {
        workTypeOptions.push({ value: 'custom', label: '직접 입력' });
      }

      const fields: FormField[] = [
        {
          name: 'staffId',
          label: '직원',
          type: 'select',
          required: true,
          placeholder: '근무중인 직원을 선택하세요',
          options: staffList
            .filter(st => st.status === 'active')
            .map(st => ({
              value: st.id,
              label: `${st.name} (${st.position}) - ${st.employmentType}`
            }))
        },
        {
          name: 'date',
          label: '날짜',
          type: 'date',
          required: true,
          validation: (value: unknown) => {
            const v = String(value ?? '');
            if (!v) return undefined;
            const h = holidays.find(holiday => holiday.date === v);
            return h ? `${h.name}은 매장 휴일입니다. 다른 날짜를 선택해주세요.` : undefined;
          }
        },
        {
          name: 'workType',
          label: '근무 템플릿',
          type: 'select',
          required: true,
          placeholder: '근무 템플릿을 선택하세요',
          options: workTypeOptions
        }
      ];

      if (!isPartTime && workType === 'custom') {
        fields.push(
          { name: 'startTime', label: '시작 시간', type: 'time', required: true },
          { name: 'endTime', label: '종료 시간', type: 'time', required: true },
          { name: 'breakTime', label: '휴게시간 (분)', type: 'number', required: true, placeholder: '120' }
        );
      }
      fields.push({ name: 'notes', label: '메모', type: 'textarea', required: false });
      return fields;
    };
    return getFields;
  }, [staffList, workTimeTemplates, holidays]);

  // ===== Handlers =====
  const handleAddSchedule = (data: any) => {
    if (!data.staffId || !data.date || !data.workType) {
      toast.error('필수 항목을 모두 입력해주세요.');
      return;
    }
    const staff = staffList.find(s => s.id === data.staffId);
    if (!staff) {
      toast.error('선택한 직원을 찾을 수 없습니다.');
      return;
    }
    if (staff.status !== 'active') {
      const statusText: Record<Staff['status'], string> = {
        active: '근무중',
        inactive: '휴직중',
        vacation: '휴가중',
        resigned: '퇴사'
      };
      toast.error(`${staff.name}님은 현재 ${statusText[staff.status]} 상태입니다.`);
      return;
    }
    const holidayInfo = holidays.find(h => h.date === data.date);
    if (holidayInfo) {
      toast.error(`${holidayInfo.name}은 매장 휴일입니다. 다른 날짜를 선택해주세요.`);
      return;
    }

    const template = workTimeTemplates.find(t => t.type === data.workType);
    let startTime = '',
      endTime = '',
      breakTime = 0;
    if (template) {
      startTime = template.startTime;
      endTime = template.endTime;
      breakTime = template.breakTime;
    } else if (data.workType === 'custom') {
      startTime = data.startTime || '';
      endTime = data.endTime || '';
      breakTime = parseInt(data.breakTime) || 60;
    }

    const newSchedule: WorkSchedule = {
      id: Date.now().toString(),
      staffId: data.staffId,
      staffName: staff.name,
      date: data.date,
      workType: data.workType,
      startTime,
      endTime,
      breakTime,
      status: 'scheduled',
      notes: data.notes || ''
    };
    const updated = [...schedules, newSchedule];
    setSchedules(updated);

    const staffingWarnings = checkStaffingRequirements(updated, data.date);
    let coverageInfo = '';
    if (['A', 'B', 'C', 'D'].includes(data.workType)) {
      const covered = FULLTIME_COVERAGE[data.workType as keyof typeof FULLTIME_COVERAGE]
        .map(s => (s === 'open' ? '오픈' : s === 'middle' ? '미들' : '마감'))
        .join('+');
      coverageInfo = `\n✅ ${data.workType}근무로 ${covered} 시간대 커버`;
    }
    if (staffingWarnings.length > 0) {
      toast.warning(`일정 추가(인력 부족):${coverageInfo}\n${staffingWarnings.join('\n')}`, {
        duration: 10000,
        style: { whiteSpace: 'pre-line' }
      });
    } else {
      toast.success(`근무 일정이 추가되었습니다.${coverageInfo}`);
    }
    setIsScheduleModalOpen(false);
    setSelectedStaffForForm('');
    setSelectedWorkType('');
  };

  const navigateDay = (dir: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (dir === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  const currentDaySchedules = getSchedulesForDate(currentDate);
  const currentDateString = currentDate.toISOString().split('T')[0];
  const staffingWarningsForDay = checkStaffingRequirements(schedules, currentDateString);
  const businessHours = getBusinessHours();
  const isCurrentHoliday = isHoliday(currentDate);
  const holidayInfo = isCurrentHoliday ? getHolidayInfo(currentDate) : undefined;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">근무 일정 관리</h1>
          <p className="text-sm text-gray-600 mt-1">
            직원들의 출퇴근 및 휴가 일정을 관리합니다
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsScheduleModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> 일정 추가
          </Button>
        </div>
      </div>

      {/* 검색/필터 */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="직원명 / ID로 검색..."
                  value={attendanceKeyword}
                  onChange={e => {
                    setAttendanceKeyword(e.target.value);
                    setSearchTerm(e.target.value); // 스케줄 리스트 필터도 같이 사용
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      setAttendancePage(0);
                      loadAttendance(currentDate, 0);
                    }
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              {/* 검색 타입 */}
              <Select
                value={attendanceSearchType}
                onValueChange={v =>
                  setAttendanceSearchType(v as 'name' | 'id' | 'all')
                }
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">이름</SelectItem>
                  <SelectItem value="id">직원ID</SelectItem>
                  <SelectItem value="all">전체</SelectItem>
                </SelectContent>
              </Select>

              {/* 근태 상태 필터 */}
              <Select
                value={attendanceStatusFilter}
                onValueChange={v => setAttendanceStatusFilter(v)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="근태 상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체</SelectItem>
                  <SelectItem value="NORMAL">정상출근</SelectItem>
                  <SelectItem value="WORKING">근무중</SelectItem>
                  <SelectItem value="COMPLETED">완료</SelectItem>
                  <SelectItem value="LATE">지각</SelectItem>
                  <SelectItem value="ABSENT">결근</SelectItem>
                </SelectContent>
              </Select>

              {/* 검색 버튼 */}
              <Button
                variant="outline"
                onClick={() => {
                  setAttendancePage(0);
                  loadAttendance(currentDate, 0);
                }}
              >
                검색
              </Button>
            </div>
          </div>

          {/* 기존 스케줄용 직원/뷰 모드 필터 */}
          <div className="flex gap-2">
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="직원 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 직원</SelectItem>
                {staffList.map(st => (
                  <SelectItem key={st.id} value={st.id}>
                    {st.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">주간</SelectItem>
                <SelectItem value="month">월간</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 날짜 네비게이션 (하루 단위) */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => navigateDay('prev')} className="gap-2">
              <ChevronLeft className="w-4 h-4" /> 이전 날
            </Button>
            <h2 className="font-semibold">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월{' '}
              {currentDate.getDate()}일 ({dayNames[currentDate.getDay()]})
            </h2>
            <Button variant="outline" onClick={() => navigateDay('next')} className="gap-2">
              다음 날 <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 하루 리스트 뷰 */}
      <Card>
        <CardContent className="p-6 space-y-4">
          {/* 직원 근태 리스트 */}
          {attendanceLoading ? (
            <div className="text-sm text-gray-500 px-1">근태 데이터를 불러오는 중입니다...</div>
          ) : attendanceList.length > 0 ? (
            <>
              <div className="border rounded-lg overflow-hidden">
                {/* 헤더 */}
                <div className="grid grid-cols-7 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-600">
                  <div className="col-span-2 text-left">직원</div>
                  <div className="text-left">출근</div>
                  <div className="text-left">퇴근</div>
                  <div className="text-left">근태 상태</div>
                  <div className="text-left">실제 근무시간(h)</div>
                </div>

                {/* 데이터 rows */}
                {attendanceList.map(item => (
                  <div
                    key={item.attendanceId}
                    className="grid grid-cols-7 items-center px-4 py-3 text-sm border-t hover:bg-gray-50"
                  >
                    {/* 직원 */}
                    <div className="col-span-2 flex flex-col">
                      <span className="font-medium">{item.staffName}</span>
                      <span className="text-xs text-gray-500">
                        {getEmploymentTypeLabel(item.staffEmploymentType)}
                      </span>
                    </div>

                    {/* 출근 */}
                    <div>{formatTime(item.attendanceCheckIn)}</div>

                    {/* 퇴근 */}
                    <div>{formatTime(item.attendanceCheckOut)}</div>

                    {/* 근태 상태 */}
                    <div>{getAttendanceStatusBadge(item.attendanceStatus)}</div>

                    {/* 실제 근무시간 */}
                    <div>{item.attendanceWorkHours?.toFixed(2)}</div>
                  </div>
                ))}
              </div>

              {/* 페이징 버튼 */}
              <div className="flex justify-end gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={attendancePage <= 0}
                  onClick={() => loadAttendance(currentDate, attendancePage - 1)}
                >
                  이전
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={attendancePage + 1 >= attendanceTotalPages}
                  onClick={() => loadAttendance(currentDate, attendancePage + 1)}
                >
                  다음
                </Button>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500 px-1">
              오늘 등록된 근태 기록이 없습니다.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 모달들 */}
      <FormModal
        key="add-schedule"
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setSelectedStaffForForm('');
          setSelectedWorkType('');
        }}
        onSubmit={handleAddSchedule}
        title="근무 일정 추가"
        fields={scheduleFormFields(selectedStaffForForm, selectedWorkType)}
        initialData={{ date: todayStr, breakTime: 120 }}
        onChange={(field, value) => {
          if (field === 'staffId') setSelectedStaffForForm(String(value ?? ''));
          if (field === 'workType') setSelectedWorkType(String(value ?? ''));
        }}
      />

      <FormModal
        key={`edit-schedule-${editingSchedule?.id || 'new'}`}
        isOpen={!!editingSchedule}
        onClose={() => {
          setEditingSchedule(null);
          setSelectedStaffForForm('');
          setSelectedWorkType('');
        }}
        onSubmit={data => {
          const staff = staffList.find(s => s.id === data.staffId);
          const template = workTimeTemplates.find(
            t => t.type === String(data.workType)
          );

          let startTime = '';
          let endTime = '';
          let breakTime = 0;

          if (template) {
            ({ startTime, endTime, breakTime } = template);
          } else if (String(data.workType) === 'custom') {
            startTime = String((data as Record<string, unknown>).startTime ?? '');
            endTime = String((data as Record<string, unknown>).endTime ?? '');
            breakTime = Number((data as Record<string, unknown>).breakTime ?? 60);
          }

          setSchedules(
            schedules.map(s =>
              s.id === editingSchedule?.id
                ? {
                    ...s,
                    ...data,
                    startTime,
                    endTime,
                    breakTime,
                    staffName: staff?.name || s.staffName
                  }
                : s
            )
          );
          setEditingSchedule(null);
          setSelectedStaffForForm('');
          setSelectedWorkType('');
          toast.success('일정이 수정되었습니다.');
        }}
        title="일정 수정"
        fields={scheduleFormFields(
          selectedStaffForForm || editingSchedule?.staffId || '',
          selectedWorkType || editingSchedule?.workType
        )}
        initialData={editingSchedule ? toFormValues(editingSchedule) : undefined}
        onChange={(field, value) => {
          if (field === 'staffId') setSelectedStaffForForm(String(value ?? ''));
          if (field === 'workType') setSelectedWorkType(String(value ?? ''));
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (!deleteConfirm) return;
          setSchedules(schedules.filter(s => s.id !== deleteConfirm.id));
          toast.success('일정이 삭제되었습니다.');
          setDeleteConfirm(null);
        }}
        title="일정 삭제"
        description="정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
      />
    </div>
  );
}
