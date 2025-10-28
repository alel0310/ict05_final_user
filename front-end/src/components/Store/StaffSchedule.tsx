import React, { useEffect, useMemo, useState } from 'react';
import { KPICard } from '../Common/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { FormModal } from '../Common/FormModal';
import { ConfirmDialog } from '../Common/ConfirmDialog';
import {
  CalendarX, CalendarDays, Clock, Plus, Edit, Trash2, UserCheck,
  Coffee, Sun, Moon, Timer, DollarSign, FileText, ChevronLeft, ChevronRight,
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
interface VacationRequest {
  id: string;
  staffId: string;
  staffName: string;
  startDate: string;
  endDate: string;
  type: 'annual' | 'sick' | 'personal' | 'maternity';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  approvedBy?: string;
  approvedDate?: string;
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
  validation?: (value: unknown) => string | undefined; // ← 여기만 변경
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



// ===== Constants (영업시간/요구인원/커버리지만 유지) =====
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
  const daySchedules = schedules.filter(s => s.date === date && s.workType !== 'vacation' && s.workType !== 'off');

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
  (Object.entries(STAFFING_REQUIREMENTS.partTime) as Array<[keyof typeof partTimeCount, number]>)
    .forEach(([shift, required]) => {
      const totalCoverage = partTimeCount[shift] + fullTimeCoverage[shift];
      if (totalCoverage < required) {
        const shiftName = shift === 'open' ? '오픈' : shift === 'middle' ? '미들' : '마감';
        const shortage = required - totalCoverage;
        warnings.push(`${shiftName} 시간대 ${shortage}명 부족 (파트타임 ${partTimeCount[shift]}명 + 정규직커버 ${fullTimeCoverage[shift]}명 = ${totalCoverage}명, 필요 ${required}명)`);
      }
    });

  if (fullTimeShifts.length < STAFFING_REQUIREMENTS.fullTime.minimum) {
    warnings.push(`정규직 ${STAFFING_REQUIREMENTS.fullTime.minimum - fullTimeShifts.length}명 부족 (A, B, C, D 시프트 중 최소 1명 필요)`);
  }
  return warnings;
};

const getBusinessHours = () => BUSINESS_HOURS;

export function StaffSchedule() {
  // ===== Empty states (데이터는 나중에 주입) =====
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [workTimeTemplates, setWorkTimeTemplates] = useState<WorkTimeTemplate[]>([]);
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [vacations, setVacations] = useState<VacationRequest[]>([]);
  const [holidays, setHolidays] = useState<StoreHoliday[]>([]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [currentTab, setCurrentTab] = useState('schedule');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WorkSchedule | null>(null);
  const [editingVacation, setEditingVacationRequest] = useState<VacationRequest | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'schedule' | 'vacation', id: string } | null>(null);

  // 나중에 API 연결 자리
  useEffect(() => {
    // TODO: 여기에서 초기 데이터 불러오기
    // Promise.all([fetchStaff(), fetchTemplates(), fetchSchedules(), fetchVacations(), fetchHolidays()])
    //   .then(([staff, templates, scheds, vacs, hols]) => {
    //     setStaffList(staff);
    //     setWorkTimeTemplates(templates);
    //     setSchedules(scheds);
    //     setVacations(vacs);
    //     setHolidays(hols);
    //   });
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
      const matchesSearch = schedule.staffName?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDate && matchesStaff && matchesSearch;
    });
  };

  // 뱃지/아이콘
  const getWorkTypeIcon = (workType: string) => {
    switch (workType) {
      case 'open': return <Sun className="w-4 h-4" />;
      case 'middle': return <Coffee className="w-4 h-4" />;
      case 'close': return <Moon className="w-4 h-4" />;
      case 'A':
      case 'B':
      case 'C':
      case 'D': return <Clock className="w-4 h-4" />;
      case 'vacation': return <CalendarDays className="w-4 h-4" />;
      case 'off': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };
  const getWorkTypeBadge = (workType: string) => {
    switch (workType) {
      case 'open': return <Badge className="bg-blue-100 text-blue-800">오픈</Badge>;
      case 'middle': return <Badge className="bg-green-100 text-green-800">미들</Badge>;
      case 'close': return <Badge className="bg-purple-100 text-purple-800">마감</Badge>;
      case 'A': return <Badge className="bg-indigo-100 text-indigo-800">A근무</Badge>;
      case 'B': return <Badge className="bg-indigo-100 text-indigo-800">B근무</Badge>;
      case 'C': return <Badge className="bg-indigo-100 text-indigo-800">C근무</Badge>;
      case 'D': return <Badge className="bg-indigo-100 text-indigo-800">D근무</Badge>;
      case 'vacation': return <Badge className="bg-yellow-100 text-yellow-800">휴가</Badge>;
      case 'off': return <Badge className="bg-gray-100 text-gray-800">휴무</Badge>;
      default: return <Badge>{workType}</Badge>;
    }
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled': return <Badge variant="outline">예정</Badge>;
      case 'confirmed': return <Badge className="bg-blue-100 text-blue-800">확정</Badge>;
      case 'working': return <Badge className="bg-green-100 text-green-800">근무중</Badge>;
      case 'completed': return <Badge className="bg-gray-100 text-gray-800">완료</Badge>;
      case 'absent': return <Badge className="bg-red-100 text-red-800">결근</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };
  const getVacationStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800">대기중</Badge>;
      case 'approved': return <Badge className="bg-green-100 text-green-800">승인</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800">거부</Badge>;
      default: return <Badge>{status}</Badge>;
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

  // KPI (빈 상태면 0)
  const todayStr = new Date().toISOString().split('T')[0];
  const workingNow = schedules.filter(s => s.date === todayStr && s.status === 'working').length;
  const totalWorkHours = schedules.filter(s => s.status === 'completed')
    .reduce((sum, sch) => sum + calculateWorkHours(sch), 0);
  const pendingVacations = vacations.filter(v => v.status === 'pending').length;
  const partTimePayroll = schedules
    .filter(s => s.status === 'completed')
    .filter(s => {
      const st = staffList.find(x => x.id === s.staffId);
      return st?.employmentType === '파트타임';
    })
    .reduce((sum, s) => sum + calculatePay(s), 0);

  // 폼 선택 상태
  const [selectedStaffForForm, setSelectedStaffForForm] = useState<string>('');
  const [selectedWorkType, setSelectedWorkType] = useState<string>('');

  // ===== Forms =====
  const scheduleFormFields = useMemo(() => {
    const getFields = (selectedStaffId: string, workType?: string): FormField[] => {
      const sel = staffList.find(s => s.id === selectedStaffId);
      const isPartTime = sel?.employmentType === '파트타임';

      const availableTemplates = workTimeTemplates.filter(t => t.employmentType === sel?.employmentType);
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

  const vacationFormFields: FormField[] = useMemo(() => ([
    {
      name: 'staffId',
      label: '직원',
      type: 'select',
      required: true,
      placeholder: '근무중인 직원을 선택하세요',
      options: staffList
        .filter(st => st.status === 'active')
        .map(st => ({ value: st.id, label: `${st.name} (${st.position})` }))
    },
    { name: 'startDate', label: '시작일', type: 'date', required: true },
    { name: 'endDate', label: '종료일', type: 'date', required: true },
    {
      name: 'type',
      label: '휴가 유형',
      type: 'select',
      required: true,
      placeholder: '휴가 유형을 선택하세요',
      options: [
        { value: 'annual', label: '연차' },
        { value: 'sick', label: '병가' },
        { value: 'personal', label: '개인사유' },
        { value: 'maternity', label: '출산휴가' }
      ]
    },
    { name: 'reason', label: '사유', type: 'textarea', required: true, placeholder: '휴가 사유를 입력하세요' }
  ]), [staffList]);

  const attendanceFormFields: FormField[] = useMemo(() => ([
    {
      name: 'scheduleId',
      label: '스케줄',
      type: 'select',
      required: true,
      placeholder: '스케줄를 선택하세요',
      options: schedules
        .filter(s => ['scheduled', 'confirmed', 'working'].includes(s.status))
        .filter(s => s.date === todayStr)
        .map(s => {
          const lbl =
            s.workType === 'open' ? '오픈' :
            s.workType === 'middle' ? '미들' :
            s.workType === 'close' ? '마감' :
            s.workType === 'A' ? 'A근무' :
            s.workType === 'B' ? 'B근무' :
            s.workType === 'C' ? 'C근무' :
            s.workType === 'D' ? 'D근무' :
            s.workType === 'vacation' ? '휴가' :
            s.workType === 'off' ? '휴무' : s.workType;
          return { value: s.id, label: `${s.staffName} - ${lbl} (${s.startTime}~${s.endTime})` };
        })
    },
    { name: 'actualStartTime', label: '실제 출근 시간', type: 'time', required: false },
    { name: 'actualEndTime', label: '실제 퇴근 시간', type: 'time', required: false },
    {
      name: 'status',
      label: '상태',
      type: 'select',
      required: true,
      placeholder: '상태를 선택하세요',
      options: [
        { value: 'working', label: '근무중' },
        { value: 'completed', label: '완료' },
        { value: 'absent', label: '결근' }
      ]
    }
  ]), [schedules, todayStr]);

  const holidayFormFields: FormField[] = [
    { name: 'date', label: '날짜', type: 'date', required: true, placeholder: '휴일 날짜를 선택하세요' },
    { name: 'name', label: '휴일명', type: 'text', required: true, placeholder: '예: 개천절, 매장 정기휴무' },
    {
      name: 'type', label: '휴일 유형', type: 'select', required: true, placeholder: '휴일 유형 선택',
      options: [
        { value: 'national', label: '국가공휴일' },
        { value: 'store', label: '매장휴일' },
        { value: 'special', label: '특별휴일' }
      ]
    },
    { name: 'description', label: '설명 (선택)', type: 'textarea', required: false, placeholder: '추가 설명' }
  ];

  // ===== Handlers (동작은 유지, 데이터만 빈 상태) =====
  const handleAddSchedule = (data: any) => {
    if (!data.staffId || !data.date || !data.workType) {
      toast.error('필수 항목을 모두 입력해주세요.');
      return;
    }
    const staff = staffList.find(s => s.id === data.staffId);
    if (!staff) { toast.error('선택한 직원을 찾을 수 없습니다.'); return; }
    if (staff.status !== 'active') {
      const statusText: Record<Staff['status'], string> = {
        active: '근무중', inactive: '휴직중', vacation: '휴가중', resigned: '퇴사'
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
    let startTime = '', endTime = '', breakTime = 0;
    if (template) {
      startTime = template.startTime; endTime = template.endTime; breakTime = template.breakTime;
    } else if (data.workType === 'custom') {
      startTime = data.startTime || ''; endTime = data.endTime || ''; breakTime = parseInt(data.breakTime) || 60;
    }

    const newSchedule: WorkSchedule = {
      id: Date.now().toString(),
      staffId: data.staffId,
      staffName: staff.name,
      date: data.date,
      workType: data.workType,
      startTime, endTime, breakTime,
      status: 'scheduled',
      notes: data.notes || ''
    };
    const updated = [...schedules, newSchedule];
    setSchedules(updated);

    const staffingWarnings = checkStaffingRequirements(updated, data.date);
    let coverageInfo = '';
    if (['A', 'B', 'C', 'D'].includes(data.workType)) {
      const covered = FULLTIME_COVERAGE[data.workType as keyof typeof FULLTIME_COVERAGE]
        .map(s => (s === 'open' ? '오픈' : s === 'middle' ? '미들' : '마감')).join('+');
      coverageInfo = `\n✅ ${data.workType}근무로 ${covered} 시간대 커버`;
    }
    if (staffingWarnings.length > 0) {
      toast.warning(`일정 추가(인력 부족):${coverageInfo}\n${staffingWarnings.join('\n')}`, {
        duration: 10000, style: { whiteSpace: 'pre-line' }
      });
    } else {
      toast.success(`근무 일정이 추가되었습니다.${coverageInfo}`);
    }
    setIsScheduleModalOpen(false);
    setSelectedStaffForForm('');
    setSelectedWorkType('');
  };

  const handleAddVacation = (data: any) => {
    if (!data.staffId || !data.startDate || !data.endDate || !data.type || !data.reason) {
      toast.error('필수 항목을 모두 입력해주세요.'); return;
    }
    const staff = staffList.find(s => s.id === data.staffId);
    if (!staff) { toast.error('선택한 직원을 찾을 수 없습니다.'); return; }
    if (staff.status !== 'active') {
      const statusText: Record<Staff['status'], string> = {
        active: '근무중', inactive: '휴직중', vacation: '휴가중', resigned: '퇴사'
      };
      toast.error(`${staff.name}님은 현재 ${statusText[staff.status]} 상태입니다.`); return;
    }
    const newVacation: VacationRequest = {
      id: Date.now().toString(),
      staffId: data.staffId,
      staffName: staff.name,
      startDate: data.startDate,
      endDate: data.endDate,
      type: data.type,
      reason: data.reason,
      status: 'pending',
      requestDate: todayStr
    };
    setVacations(v => [...v, newVacation]);
    setIsVacationModalOpen(false);
    toast.success('휴가 신청이 등록되었습니다.');
  };

  const handleAddHoliday = (data: any) => {
    if (!data.date || !data.name || !data.type) { toast.error('필수 항목을 모두 입력해주세요.'); return; }
    const newHoliday: StoreHoliday = {
      id: Date.now().toString(),
      date: data.date,
      name: data.name,
      type: data.type,
      description: data.description || '',
      createdBy: '매장장',
      createdDate: todayStr
    };
    setHolidays(h => [...h, newHoliday]);
    setIsHolidayModalOpen(false);
    toast.success('휴일이 지정되었습니다.');
  };

  const handleUpdateAttendance = (data: any) => {
    if (!data.scheduleId || !data.status) { toast.error('필수 항목을 모두 입력해주세요.'); return; }
    setSchedules(schedules.map(s =>
      s.id === data.scheduleId
        ? { ...s, actualStartTime: data.actualStartTime || s.actualStartTime, actualEndTime: data.actualEndTime || s.actualEndTime, status: data.status }
        : s
    ));
    setIsAttendanceModalOpen(false);
    toast.success('출퇴근 기록이 업데이트되었습니다.');
  };

  const handleApproveVacation = (id: string, approved: boolean) => {
    setVacations(vacs => vacs.map(v => v.id === id
      ? { ...v, status: approved ? 'approved' : 'rejected', approvedBy: '매장장', approvedDate: todayStr }
      : v
    ));
    toast.success(`휴가 신청이 ${approved ? '승인' : '거부'}되었습니다.`);
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
          <p className="text-sm text-gray-600 mt-1">직원들의 출퇴근 및 휴가 일정을 관리합니다</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsScheduleModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> 일정 추가
          </Button>
          <Button onClick={() => setIsVacationModalOpen(true)} variant="outline" className="gap-2">
            <CalendarDays className="w-4 h-4" /> 휴가 신청
          </Button>
          <Button onClick={() => setIsAttendanceModalOpen(true)} variant="outline" className="gap-2">
            <Clock className="w-4 h-4" /> 출퇴근 기록
          </Button>
          <Button onClick={() => setIsHolidayModalOpen(true)} variant="outline" className="gap-2">
            <CalendarX className="w-4 h-4" /> 휴일 지정
          </Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="현재 근무중" value={`${workingNow}명`} icon={UserCheck} color="green" trend={+0} />
        <KPICard title="이번 주 총 근무시간" value={`${totalWorkHours.toFixed(1)}시간`} icon={Timer} color="purple" trend={+0} />
        <KPICard title="대기중인 휴가" value={`${pendingVacations}건`} icon={AlertTriangle} color="orange" trend={0} />
        <KPICard title="파트타임 급여" value={`${partTimePayroll.toLocaleString()}원`} icon={DollarSign} color="purple" trend={0} />
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="schedule">근무 일정</TabsTrigger>
          <TabsTrigger value="vacation">휴가 관리</TabsTrigger>
          <TabsTrigger value="attendance">출퇴근 현황</TabsTrigger>
          <TabsTrigger value="templates">근무 템플릿</TabsTrigger>
        </TabsList>

        {/* 일정 탭 */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input placeholder="직원명으로 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
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
                        <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">주간</SelectItem>
                      <SelectItem value="month">월간</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => navigateWeek('prev')} className="gap-2">
                  <ChevronLeft className="w-4 h-4" /> 이전 주
                </Button>
                <h2 className="font-semibold">
                  {(() => {
                    const s = weekDates[0]; const e = weekDates[6];
                    const y = s.getFullYear();
                    const sm = s.getMonth() + 1; const em = e.getMonth() + 1;
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
                                    <div className="text-sm font-semibold text-red-800 mb-1">매장 휴일</div>
                                    <div className="text-lg font-bold text-red-900">{holidayInfo?.name}</div>
                                    <div className="text-xs text-red-600 mt-1">
                                      {holidayInfo?.type === 'national' ? '국가공휴일' : holidayInfo?.type === 'store' ? '매장휴일' : '특별휴일'}
                                    </div>
                                  </div>
                                  <div className="pt-2 border-t border-red-200">
                                    <div className="text-xs text-red-500 font-medium">매장 휴무</div>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          const dateString = weekDates[idx].toISOString().split('T')[0];
                          const staffingWarnings = checkStaffingRequirements(schedules, dateString);
                          return (
                            <div className={`p-4 rounded-lg border-2 border-dashed ${staffingWarnings.length > 0 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                              <div className="text-center space-y-3">
                                <div className="flex items-center justify-center gap-2">
                                  <div className={`p-2 rounded-full ${staffingWarnings.length > 0 ? 'bg-red-100' : 'bg-blue-100'}`}>
                                    {staffingWarnings.length > 0 ? (
                                      <AlertTriangle className="w-4 h-4 text-red-600" />
                                    ) : (
                                      <Clock className="w-4 h-4 text-blue-600" />
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <div className={`text-sm font-semibold mb-1 ${staffingWarnings.length > 0 ? 'text-red-800' : 'text-blue-800'}`}>
                                    {staffingWarnings.length > 0 ? '인력 부족' : '매장 영업시간'}
                                  </div>
                                  <div className={`text-lg font-bold ${staffingWarnings.length > 0 ? 'text-red-900' : 'text-blue-900'}`}>
                                    {businessHours.open} - {businessHours.close}
                                  </div>
                                  <div className={`text-xs mt-1 ${staffingWarnings.length > 0 ? 'text-red-600' : 'text-blue-600'}`}>(14시간 영업)</div>
                                </div>
                                <div className={`pt-2 border-t ${staffingWarnings.length > 0 ? 'border-red-200' : 'border-blue-200'}`}>
                                  <div className={`text-xs font-medium ${staffingWarnings.length > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                    {staffingWarnings.length > 0 ? `${staffingWarnings.length}개 경고` : '직원 스케줄 없음'}
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
                              <Card key={schedule.id} className="p-3 text-left hover:shadow-md transition-shadow cursor-pointer">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm">{schedule.staffName}</span>
                                    {getStatusBadge(schedule.status)}
                                  </div>

                                  <div className="flex items-center gap-1">
                                    {getWorkTypeIcon(schedule.workType)}
                                    {getWorkTypeBadge(schedule.workType)}
                                  </div>

                                  {schedule.workType !== 'vacation' && schedule.workType !== 'off' && (
                                    <div className="flex items-center gap-1 text-xs">
                                      <Clock className="w-3 h-3" />
                                      {schedule.startTime} - {schedule.endTime}
                                    </div>
                                  )}

                                  {schedule.actualStartTime && schedule.actualEndTime && (
                                    <div className="text-xs text-gray-600">
                                      실제: {schedule.actualStartTime} - {schedule.actualEndTime}
                                      {(() => {
                                        const staff = staffList.find(s => s.id === schedule.staffId);
                                        const isPartTime = staff?.employmentType === '파트타임';
                                        return isPartTime ? (
                                          <>
                                            <br />
                                            급여: {calculatePay(schedule).toLocaleString()}원
                                          </>
                                        ) : null;
                                      })()}
                                    </div>
                                  )}

                                  <div className="flex justify-between items-center">
                                    <div className="text-xs text-gray-500">휴게: {schedule.breakTime}분</div>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost" size="sm"
                                        onClick={() => { setEditingSchedule(schedule); setSelectedStaffForForm(schedule.staffId); }}
                                        className="p-1 h-6 w-6"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="ghost" size="sm"
                                        onClick={() => setDeleteConfirm({ type: 'schedule', id: schedule.id })}
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
                                  <span className="text-xs font-medium text-orange-800">인력 부족</span>
                                </div>
                                <div className="text-xs text-orange-700 space-y-1">
                                  {staffingWarnings.map((w, i) => (<div key={i}>{w}</div>))}
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
        </TabsContent>

        {/* 휴가, 출퇴근, 템플릿 탭은 그대로 유지 (빈 목록이면 아무 카드도 안 뜸) */}
        <TabsContent value="vacation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" /> 휴가 신청 관리
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vacations.map(v => (
                  <div key={v.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{v.staffName}</span>
                        {getVacationStatusBadge(v.status)}
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>기간: {v.startDate} ~ {v.endDate}</div>
                        <div>유형: {v.type === 'annual' ? '연차' : v.type === 'sick' ? '병가' : v.type === 'personal' ? '개인사유' : '출산휴가'}</div>
                        <div>사유: {v.reason}</div>
                        <div>신청일: {v.requestDate}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {v.status === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => handleApproveVacation(v.id, true)} className="gap-1">승인</Button>
                          <Button size="sm" variant="outline" onClick={() => handleApproveVacation(v.id, false)} className="gap-1">거부</Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm({ type: 'vacation', id: v.id })} className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" /> 출퇴근 현황
                </CardTitle>
                <Button onClick={() => setIsAttendanceModalOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" /> 출퇴근 기록
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schedules
                  .filter(s => ['scheduled', 'confirmed', 'working', 'completed'].includes(s.status))
                  .filter(s => {
                    const d = new Date(s.date); const today = new Date();
                    const diffDays = Math.ceil((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
                    return diffDays >= -1 && diffDays <= 7;
                  })
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(sch => {
                    const st = staffList.find(s => s.id === sch.staffId);
                    const isPartTime = st?.employmentType === '파트타임';
                    return (
                      <div key={sch.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{sch.staffName}</span>
                            <Badge variant="outline" className={`text-xs ${isPartTime ? 'border-orange-200 text-orange-700' : 'border-blue-200 text-blue-700'}`}>
                              {st?.employmentType || '정규직'}
                            </Badge>
                            {getStatusBadge(sch.status)}
                            {getWorkTypeBadge(sch.workType)}
                          </div>
                          <div className="text-sm text-gray-600">
                            <div>날짜: {sch.date}</div>
                            <div>예정: {sch.startTime} - {sch.endTime}</div>
                            {sch.actualStartTime && sch.actualEndTime && (<div>실제: {sch.actualStartTime} - {sch.actualEndTime}</div>)}
                            <div>근무시간: {calculateWorkHours(sch).toFixed(1)}시간</div>
                            {isPartTime && (<div>예상급여: {calculatePay(sch).toLocaleString()}원</div>)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">{calculateWorkHours(sch).toFixed(1)}h</div>
                          {isPartTime && (<div className="text-sm text-gray-600">{calculatePay(sch).toLocaleString()}원</div>)}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" /> 근무 시간 템플릿
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {workTimeTemplates.map(t => (
                  <Card key={t.id} className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      {getWorkTypeIcon(t.type)}
                      <h3 className="font-medium">{t.name}</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>시간: {t.startTime} - {t.endTime}</div>
                      <div>휴게: {t.breakTime}분</div>
                      <div className="text-gray-600">{t.description}</div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 모달들 */}
      <FormModal
        key="add-schedule"
        isOpen={isScheduleModalOpen}
        onClose={() => { setIsScheduleModalOpen(false); setSelectedStaffForForm(''); setSelectedWorkType(''); }}
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
        isOpen={isVacationModalOpen}
        onClose={() => setIsVacationModalOpen(false)}
        onSubmit={handleAddVacation}
        title="휴가 신청"
        fields={vacationFormFields}
      />

      <FormModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        onSubmit={handleUpdateAttendance}
        title="출퇴근 기록"
        fields={attendanceFormFields}
      />

      <FormModal
        isOpen={isHolidayModalOpen}
        onClose={() => setIsHolidayModalOpen(false)}
        onSubmit={handleAddHoliday}
        title="휴일 지정"
        fields={holidayFormFields}
        initialData={{ date: todayStr, type: 'store' }}
      />

      <FormModal
        key={`edit-schedule-${editingSchedule?.id || 'new'}`}
        isOpen={!!editingSchedule}
        onClose={() => { setEditingSchedule(null); setSelectedStaffForForm(''); setSelectedWorkType(''); }}
        onSubmit={(data) => {
          const staff = staffList.find(s => s.id === data.staffId);
          const template = workTimeTemplates.find(t => t.type === String(data.workType));

            let startTime = '';
            let endTime = '';
            let breakTime = 0;

            if (template) {
            ({ startTime, endTime, breakTime } = template);
            } else if (String(data.workType) === 'custom') {
            startTime = String((data as Record<string, unknown>).startTime ?? '');
            endTime   = String((data as Record<string, unknown>).endTime ?? '');
            breakTime = Number((data as Record<string, unknown>).breakTime ?? 60);
            }setSchedules(schedules.map(s =>
            s.id === editingSchedule?.id
              ? { ...s, ...data, startTime, endTime, breakTime, staffName: staff?.name || s.staffName }
              : s
          ));
          setEditingSchedule(null);
          setSelectedStaffForForm('');
          setSelectedWorkType('');
          toast.success('일정이 수정되었습니다.');
        }}
        title="일정 수정"
        fields={scheduleFormFields(selectedStaffForForm || editingSchedule?.staffId || '', selectedWorkType || editingSchedule?.workType)}
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
          if (deleteConfirm.type === 'schedule') {
            setSchedules(schedules.filter(s => s.id !== deleteConfirm.id));
            toast.success('일정이 삭제되었습니다.');
          } else {
            setVacations(vacations.filter(v => v.id !== deleteConfirm.id));
            toast.success('휴가 신청이 삭제되었습니다.');
          }
          setDeleteConfirm(null);
        }}
        title={deleteConfirm?.type === 'schedule' ? '일정 삭제' : '휴가 신청 삭제'}
        description="정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
      />
    </div>
  );
}
