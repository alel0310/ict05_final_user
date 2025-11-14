import React, { useEffect, useMemo, useState } from 'react';
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
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week'); // 월간 구현 전이라도 일단 유지
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 모달
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WorkSchedule | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'schedule'; id: string } | null>(
    null
  );

  useEffect(() => {
    // TODO: 초기 데이터 로딩
  }, []);

  // 주 계산
  const getWeekDates = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay(); // 0=일
    const diff = start.getDate() - day;
    start.setDate(diff);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };
  const weekDates = getWeekDates(currentDate);

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

  const navigateWeek = (dir: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (dir === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

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
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="직원명으로 검색..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
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
          </div>
        </CardContent>
      </Card>

      {/* 주간 네비게이션 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => navigateWeek('prev')} className="gap-2">
              <ChevronLeft className="w-4 h-4" /> 이전 주
            </Button>
            <h2 className="font-semibold">
              {(() => {
                const s = weekDates[0];
                const e = weekDates[6];
                const y = s.getFullYear();
                const sm = s.getMonth() + 1;
                const em = e.getMonth() + 1;
                return sm === em
                  ? `${y}년 ${sm}월 ${s.getDate()}일 - ${e.getDate()}일`
                  : `${y}년 ${sm}월 ${s.getDate()}일 - ${em}월 ${e.getDate()}일`;
              })()}
            </h2>
            <Button variant="outline" onClick={() => navigateWeek('next')} className="gap-2">
              다음 주 <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 주간 캘린더 */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-4">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
              <div key={day} className="text-center">
                <div className="font-semibold mb-2 pb-2 border-b">
                  <div>{day}</div>
                  <div className="text-sm text-gray-600">{weekDates[idx].getDate()}</div>
                </div>

                <div className="space-y-2 min-h-32">
                  {(() => {
                    const daySchedules = getSchedulesForDate(weekDates[idx]);
                    const businessHours = getBusinessHours();

                    if (daySchedules.length === 0) {
                      if (isHoliday(weekDates[idx])) {
                        const holidayInfo = getHolidayInfo(weekDates[idx]);
                        return (
                          <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200 border-dashed">
                            <div className="text-center space-y-3">
                              <div className="flex items-center justify-center gap-2">
                                <div className="p-2 bg-red-100 rounded-full">
                                  <CalendarX className="w-4 h-4 text-red-600" />
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-red-800 mb-1">
                                  매장 휴일
                                </div>
                                <div className="text-lg font-bold text-red-900">
                                  {holidayInfo?.name}
                                </div>
                                <div className="text-xs text-red-600 mt-1">
                                  {holidayInfo?.type === 'national'
                                    ? '국가공휴일'
                                    : holidayInfo?.type === 'store'
                                    ? '매장휴일'
                                    : '특별휴일'}
                                </div>
                              </div>
                              <div className="pt-2 border-t border-red-200">
                                <div className="text-xs text-red-500 font-medium">
                                  매장 휴무
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      const dateString = weekDates[idx].toISOString().split('T')[0];
                      const staffingWarnings = checkStaffingRequirements(schedules, dateString);
                      return (
                        <div
                          className={`p-4 rounded-lg border-2 border-dashed ${
                            staffingWarnings.length > 0
                              ? 'bg-red-50 border-red-200'
                              : 'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <div className="text-center space-y-3">
                            <div className="flex items-center justify-center gap-2">
                              <div
                                className={`p-2 rounded-full ${
                                  staffingWarnings.length > 0
                                    ? 'bg-red-100'
                                    : 'bg-blue-100'
                                }`}
                              >
                                {staffingWarnings.length > 0 ? (
                                  <AlertTriangle className="w-4 h-4 text-red-600" />
                                ) : (
                                  <Clock className="w-4 h-4 text-blue-600" />
                                )}
                              </div>
                            </div>
                            <div>
                              <div
                                className={`text-sm font-semibold mb-1 ${
                                  staffingWarnings.length > 0
                                    ? 'text-red-800'
                                    : 'text-blue-800'
                                }`}
                              >
                                {staffingWarnings.length > 0 ? '인력 부족' : '매장 영업시간'}
                              </div>
                              <div
                                className={`text-lg font-bold ${
                                  staffingWarnings.length > 0
                                    ? 'text-red-900'
                                    : 'text-blue-900'
                                }`}
                              >
                                {businessHours.open} - {businessHours.close}
                              </div>
                              <div
                                className={`text-xs mt-1 ${
                                  staffingWarnings.length > 0
                                    ? 'text-red-600'
                                    : 'text-blue-600'
                                }`}
                              >
                                (14시간 영업)
                              </div>
                            </div>
                            <div
                              className={`pt-2 border-t ${
                                staffingWarnings.length > 0
                                  ? 'border-red-200'
                                  : 'border-blue-200'
                              }`}
                            >
                              <div
                                className={`text-xs font-medium ${
                                  staffingWarnings.length > 0
                                    ? 'text-red-500'
                                    : 'text-blue-500'
                                }`}
                              >
                                {staffingWarnings.length > 0
                                  ? `${staffingWarnings.length}개 경고`
                                  : '직원 스케줄 없음'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    const dateString = weekDates[idx].toISOString().split('T')[0];
                    const staffingWarnings = checkStaffingRequirements(schedules, dateString);

                    return (
                      <>
                        {daySchedules.map(schedule => (
                          <Card
                            key={schedule.id}
                            className="p-3 text-left hover:shadow-md transition-shadow cursor-pointer"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">
                                  {schedule.staffName}
                                </span>
                                {getStatusBadge(schedule.status)}
                              </div>

                              <div className="flex items-center gap-1">
                                {getWorkTypeIcon(schedule.workType)}
                                {getWorkTypeBadge(schedule.workType)}
                              </div>

                              {schedule.workType !== 'vacation' &&
                                schedule.workType !== 'off' && (
                                  <div className="flex items-center gap-1 text-xs">
                                    <Clock className="w-3 h-3" />
                                    {schedule.startTime} - {schedule.endTime}
                                  </div>
                                )}

                              {schedule.actualStartTime && schedule.actualEndTime && (
                                <div className="text-xs text-gray-600">
                                  실제: {schedule.actualStartTime} - {schedule.actualEndTime}
                                  {(() => {
                                    const staff = staffList.find(
                                      s => s.id === schedule.staffId
                                    );
                                    const isPartTime =
                                      staff?.employmentType === '파트타임';
                                    return isPartTime ? (
                                      <>
                                        <br />
                                        급여:{' '}
                                        {calculatePay(schedule).toLocaleString()}원
                                      </>
                                    ) : null;
                                  })()}
                                </div>
                              )}

                              <div className="flex justify-between items-center">
                                <div className="text-xs text-gray-500">
                                  휴게: {schedule.breakTime}분
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingSchedule(schedule);
                                      setSelectedStaffForForm(schedule.staffId);
                                    }}
                                    className="p-1 h-6 w-6"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      setDeleteConfirm({
                                        type: 'schedule',
                                        id: schedule.id
                                      })
                                    }
                                    className="p-1 h-6 w-6 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}

                        {staffingWarnings.length > 0 && (
                          <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-center gap-1 mb-1">
                              <AlertTriangle className="w-3 h-3 text-orange-600" />
                              <span className="text-xs font-medium text-orange-800">
                                인력 부족
                              </span>
                            </div>
                            <div className="text-xs text-orange-700 space-y-1">
                              {staffingWarnings.map((w, i) => (
                                <div key={i}>{w}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
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
