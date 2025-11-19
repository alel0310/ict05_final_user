import React, { useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { FormModal } from '../Common/FormModal';
import { Plus, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
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

// === 백엔드 AttendanceListDTO/AttendanceStatus 에 맞춘 타입들 ===
type AttendanceStatusType =
  | 'NORMAL'
  | 'LATE'
  | 'EARLY_LEAVE'
  | 'ABSENT'
  | 'VACATION'
  | 'HOLIDAY'
  | 'RESIGN'
  | (string & {});

type StaffEmploymentTypeType = 'OWNER' | 'STAFF' | 'PART_TIME' | (string & {});

interface AttendanceItem {
  attendanceId: number;
  attendanceWorkDate: string;
  attendanceCheckIn: string | null;
  attendanceCheckOut: string | null;
  attendanceStatus: AttendanceStatusType;
  attendanceWorkHours: number;
  staffId: number;
  staffName: string;
  staffEmploymentType: StaffEmploymentTypeType;
}

// ✅ 근무상세 모달용 상세 DTO 타입
interface AttendanceDetail {
  attendanceId: number;
  attendanceWorkDate: string;
  attendanceCheckIn: string | null;
  attendanceCheckOut: string | null;
  attendanceStatus: AttendanceStatusType;
  attendanceWorkHours: number;
  attendanceMemo: string | null;
  staffId: number;
  staffName: string;
  staffEmploymentType: StaffEmploymentTypeType;
}

// ⭐ 근태 수정용 DTO 타입
interface AttendanceModifyForm {
  attendanceId: number;
  attendanceWorkDate: string;
  attendanceCheckIn: string | null;
  attendanceCheckOut: string | null;
  attendanceStatus: AttendanceStatusType;
  attendanceWorkHours: number | null;
  attendanceMemo: string | null;
  staffId: number;
  staffName: string;
  staffEmploymentType: StaffEmploymentTypeType;
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

// UTC 꼬임 방지용: 로컬 기준 YYYY-MM-DD
const formatDateLocal = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// 00:00 ~ 23:30 30분 단위 시간 옵션
const TIME_OPTIONS: { value: string; label: string }[] = Array.from(
  { length: 48 },
  (_, i) => {
    const h = String(Math.floor(i / 2)).padStart(2, '0');
    const m = i % 2 === 0 ? '00' : '30';
    const time = `${h}:${m}`;
    return { value: time, label: time };
  }
);

const formatTime = (dateTime: string | null | undefined) => {
  if (!dateTime) return '-';
  return dateTime.substring(11, 16);
};

// ✅ 실제 근무시간(hh.hh)을 "7시간 15분" 형태로 변환
const formatWorkHoursLabel = (hours: number | null | undefined) => {
  if (hours == null || Number.isNaN(hours)) return '-';

  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  return `${h}시간 ${m}분`;
};

// ===== Component =====
export function StaffSchedule() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [holidays, setHolidays] = useState<StoreHoliday[]>([]);

  const [currentDate, setCurrentDate] = useState(new Date());

  const [attendanceList, setAttendanceList] = useState<AttendanceItem[]>([]);
  const [attendancePage, setAttendancePage] = useState(0);
  const [attendanceTotalPages, setAttendanceTotalPages] = useState(0);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const [attendanceKeyword, setAttendanceKeyword] = useState('');
  const [attendanceSearchType, setAttendanceSearchType] =
    useState<'name' | 'id' | 'all'>('name');
  const [attendanceStatusFilter, setAttendanceStatusFilter] =
    useState<string>('ALL');

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedStaffForForm, setSelectedStaffForForm] = useState<string>('');

  // ✅ 근무상세 모달 state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [attendanceDetail, setAttendanceDetail] =
    useState<AttendanceDetail | null>(null);

  // ⭐ 근태 수정 모달 state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTargetId, setEditTargetId] = useState<number | null>(null);
  const [editInitialData, setEditInitialData] = useState<FormValues | null>(
    null
  );
  const [editLoading, setEditLoading] = useState(false);

  // =====================
  // 📌 직원 / 휴일 로딩
  // =====================
  const loadStaff = useCallback(async () => {
    try {
      const baseUrl = import.meta.env.VITE_BACKEND_API_BASE_URL;
      const token = localStorage.getItem('accessToken');

      const res = await axios.get<PageResponse<any>>(
        `${baseUrl}/api/staff/list`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            page: 0,
            size: 9999,
          },
        }
      );

      console.log('📌 직원 응답', res.data);

      const rawList = res.data.content ?? [];

      // 🔁 백엔드 DTO -> 프론트 Staff 타입으로 매핑
      const mapped: Staff[] = rawList.map((s: any) => {
        const rawStatus = (s.staffStatus ?? s.status ?? 'ACTIVE') as string;
        let status: Staff['status'];
        switch (rawStatus.toUpperCase()) {
          case 'INACTIVE':
            status = 'inactive';
            break;
          case 'VACATION':
            status = 'vacation';
            break;
          case 'RESIGNED':
          case 'RESIGN':
            status = 'resigned';
            break;
          case 'ACTIVE':
          default:
            status = 'active';
        }

        const rawEmp = (s.staffEmploymentType ?? s.employmentType ?? '') as string;
        const employmentType: Staff['employmentType'] =
          rawEmp === 'PART_TIME' || rawEmp === 'PART_TIMER'
            ? '파트타임'
            : '정규직';

        return {
          id: String(s.id),
          name: s.staffName ?? s.name ?? '',
          position: s.staffPosition ?? s.position ?? '',
          hourlyWage: s.hourlyWage ?? s.staffHourlyWage ?? 0,
          monthlyWage: s.monthlyWage ?? s.staffMonthlyWage ?? 0,
          employmentType,
          phone: s.staffPhone ?? s.phone ?? '',
          email: s.staffEmail ?? s.email ?? '',
          status,
        };
      });

      setStaffList(mapped);
    } catch (e) {
      console.error(e);
      toast.error('직원 목록을 불러오지 못했습니다.');
    }
  }, []);

  const loadHolidays = useCallback(async () => {
    try {
      const baseUrl = import.meta.env.VITE_BACKEND_API_BASE_URL;
      const token = localStorage.getItem('accessToken');

      const res = await axios.get<StoreHoliday[]>(
        `${baseUrl}/api/store-holidays`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setHolidays(res.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadStaff();
    loadHolidays();
  }, [loadStaff, loadHolidays]);

  // =====================
  // 📌 백엔드 근태 조회 API 호출
  // =====================
  const loadAttendance = useCallback(
    async (targetDate: Date, page: number = 0) => {
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
              size: 6,
              keyword: attendanceKeyword || undefined,
              type: attendanceSearchType,
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
    },
    [attendanceKeyword, attendanceSearchType, attendanceStatusFilter]
  );

  useEffect(() => {
    setAttendancePage(0);
    loadAttendance(currentDate, 0);
  }, [
    currentDate,
    attendanceKeyword,
    attendanceSearchType,
    attendanceStatusFilter,
    loadAttendance,
  ]);

  const getAttendanceStatusBadge = (status: AttendanceStatusType) => {
    switch (status) {
      case 'NORMAL':
        return <Badge className="bg-green-100 text-green-800">정상</Badge>;
      case 'LATE':
        return <Badge className="bg-yellow-100 text-yellow-800">지각</Badge>;
      case 'EARLY_LEAVE':
        return <Badge className="bg-orange-100 text-orange-800">조퇴</Badge>;
      case 'ABSENT':
        return <Badge className="bg-red-100 text-red-800">결근</Badge>;
      case 'VACATION':
        return <Badge className="bg-blue-100 text-blue-800">휴가</Badge>;
      case 'HOLIDAY':
        return <Badge className="bg-purple-100 text-purple-800">휴일</Badge>;
      case 'RESIGN':
        return <Badge className="bg-gray-200 text-gray-700">퇴사</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEmploymentTypeLabel = (type: StaffEmploymentTypeType | string) => {
    switch (type) {
      case 'OWNER':
        return '점주';
      case 'STAFF':
        return '직원';
      case 'PART_TIME':
        return '알바';
      default:
        return type;
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // =====================
  // 📌 근태 등록 함수 (신규)
  // =====================
  const registerAttendance = async (data: any) => {
    try {
      const baseUrl = import.meta.env.VITE_BACKEND_API_BASE_URL;
      const token = localStorage.getItem('accessToken');

      const date = data.date as string; // "2025-11-22"
      const staffId = data.staffId;
      const checkInTime = data.attendanceCheckIn; // "06:30"
      const checkOutTime = data.attendanceCheckOut; // "04:30"
      const status = data.attendanceStatus || 'NORMAL';

      if (!date || !staffId || !checkInTime || !checkOutTime) {
        toast.error('근무 일자, 출근/퇴근 시간, 직원을 모두 입력해주세요.');
        return;
      }

      // 기본은 같은 날
      const attendanceWorkDate = date;
      let attendanceCheckIn = `${date}T${checkInTime}:00`;
      let attendanceCheckOutDatePart = date;

      // 🔥 퇴근 시간이 출근 시간보다 이르면 "다음 날 퇴근"으로 판단해서 날짜 +1
      if (checkOutTime <= checkInTime) {
        const [y, m, d] = date.split('-').map(Number);
        const workDate = new Date(y, m - 1, d);
        const nextDate = new Date(workDate);
        nextDate.setDate(workDate.getDate() + 1);
        attendanceCheckOutDatePart = formatDateLocal(nextDate); // "2025-11-23"
      }

      const attendanceCheckOut = `${attendanceCheckOutDatePart}T${checkOutTime}:00`;

      // ✅ 실제 근무 시간 계산 (직접 입력값이 있으면 그걸 우선 사용)
      let workHours: number;
      if (
        data.attendanceWorkHours !== undefined &&
        data.attendanceWorkHours !== null &&
        data.attendanceWorkHours !== ''
      ) {
        workHours = Number(data.attendanceWorkHours);
      } else {
        const start = new Date(attendanceCheckIn);
        const end = new Date(attendanceCheckOut);
        const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        workHours = Number(Math.max(0, diffHours).toFixed(2));
      }

      const payload = {
        staffId: Number(staffId),
        attendanceWorkDate, // "2025-11-22"
        attendanceCheckIn, // "2025-11-22T07:00:00"
        attendanceCheckOut, // "2025-11-23T04:30:00" 이런 형식
        attendanceStatus: status, // 'NORMAL' 같은 enum 값
        attendanceWorkHours: workHours, // 숫자
        attendanceMemo: data.notes || '',
      };

      console.log('📌 근태 등록 payload', payload);

      const res = await axios.post<number>(
        `${baseUrl}/api/attendance/add`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('근태 등록 완료, id=', res.data);
      toast.success('근태가 등록되었습니다.');
      loadAttendance(currentDate, 0);
    } catch (error: any) {
      console.error('📌 근태 등록 실패', error.response?.data || error);
      toast.error(
        (error.response?.data as any)?.message ||
          '근태 등록에 실패했습니다.'
      );
    }
  };

  // ⭐ 근태 수정 함수 (기존 기록 수정)
  const updateAttendance = async (attendanceId: number, data: any) => {
    try {
      const baseUrl = import.meta.env.VITE_BACKEND_API_BASE_URL;
      const token = localStorage.getItem('accessToken');

      const date = data.date as string;
      const staffId = data.staffId;
      const checkInTime = data.attendanceCheckIn;
      const checkOutTime = data.attendanceCheckOut;
      const status = data.attendanceStatus || 'NORMAL';

      if (!date || !staffId || !checkInTime || !checkOutTime) {
        toast.error('근무 일자, 출근/퇴근 시간, 직원을 모두 입력해주세요.');
        return;
      }

      const attendanceWorkDate = date;
      let attendanceCheckIn = `${date}T${checkInTime}:00`;
      let attendanceCheckOutDatePart = date;

      // 🔥 퇴근 시간이 출근 시간보다 이르면 "다음 날 퇴근" 처리
      if (checkOutTime <= checkInTime) {
        const [y, m, d] = date.split('-').map(Number);
        const workDate = new Date(y, m - 1, d);
        const nextDate = new Date(workDate);
        nextDate.setDate(workDate.getDate() + 1);
        attendanceCheckOutDatePart = formatDateLocal(nextDate);
      }

      const attendanceCheckOut = `${attendanceCheckOutDatePart}T${checkOutTime}:00`;

      let workHours: number;
      if (
        data.attendanceWorkHours !== undefined &&
        data.attendanceWorkHours !== null &&
        data.attendanceWorkHours !== ''
      ) {
        workHours = Number(data.attendanceWorkHours);
      } else {
        const start = new Date(attendanceCheckIn);
        const end = new Date(attendanceCheckOut);
        const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        workHours = Number(Math.max(0, diffHours).toFixed(2));
      }

      const payload = {
        staffId: Number(staffId),
        attendanceWorkDate,
        attendanceCheckIn,
        attendanceCheckOut,
        attendanceStatus: status,
        attendanceWorkHours: workHours,
        attendanceMemo: data.notes || '',
      };

      console.log('📌 근태 수정 payload', payload);

      await axios.put(
        `${baseUrl}/api/attendance/modify/${attendanceId}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('근태가 수정되었습니다.');
      setIsEditModalOpen(false);
      setEditTargetId(null);
      setEditInitialData(null);
      setSelectedStaffForForm('');

      // 현재 날짜/페이지 새로고침
      loadAttendance(currentDate, attendancePage);
    } catch (error: any) {
      console.error('📌 근태 수정 실패', error.response?.data || error);
      toast.error(
        (error.response?.data as any)?.message ||
          '근태 수정에 실패했습니다.'
      );
    }
  };

  // =====================
  // 📌 모달 폼 필드 정의
  // =====================
  const scheduleFormFields = useMemo(() => {
    const getFields = (selectedStaffId: string): FormField[] => {
      const sel = staffList.find(s => s.id === selectedStaffId);

      const fields: FormField[] = [
        {
          name: 'staffId',
          label: '직원',
          type: 'select',
          required: true,
          placeholder: '근무중인 직원을 선택하세요',
          options: staffList.map(st => ({
            value: st.id,
            label: `${st.name} (${st.employmentType})`,
          })),
        },
        {
          name: 'date',
          label: '근무 일자',
          type: 'date',
          required: true,
          validation: (value: unknown) => {
            const v = String(value ?? '');
            if (!v) return undefined;
            const h = holidays.find(holiday => holiday.date === v);
            return h
              ? `${h.name}은 매장 휴일입니다. 다른 날짜를 선택해주세요.`
              : undefined;
          },
        },
        {
          name: 'attendanceCheckIn',
          label: '출근 시간(근태)',
          type: 'select',
          required: true,
          placeholder: '출근 시간을 선택하세요',
          options: TIME_OPTIONS,
        },
        {
          name: 'attendanceCheckOut',
          label: '퇴근 시간(근태)',
          type: 'select',
          required: true,
          placeholder: '퇴근 시간을 선택하세요',
          options: TIME_OPTIONS,
        },
        {
          name: 'attendanceStatus',
          label: '근태 상태',
          type: 'select',
          required: true,
          placeholder: '근태 상태를 선택하세요',
          options: [
            { value: 'NORMAL', label: '정상' },
            { value: 'LATE', label: '지각' },
            { value: 'EARLY_LEAVE', label: '조퇴' },
            { value: 'ABSENT', label: '결근' },
            { value: 'VACATION', label: '휴가' },
            { value: 'HOLIDAY', label: '휴일' },
            { value: 'RESIGN', label: '퇴사' },
          ],
        },
        {
          name: 'attendanceWorkHours',
          label: '실제 근무 시간(시간 단위)',
          type: 'number',
          required: false,
          placeholder: '예: 8.0 (미입력 시 출퇴근 시간으로 자동 계산)',
        },
        {
          name: 'notes',
          label: '메모',
          type: 'textarea',
          required: false,
        },
      ];

      void sel;
      return fields;
    };
    return getFields;
  }, [staffList, holidays]);

  const handleAddSchedule = async (data: any) => {
    if (!data.staffId || !data.date) {
      toast.error('직원과 근무 일자를 모두 입력해주세요.');
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
        resigned: '퇴사',
      };
      toast.error(
        `${staff.name}님은 현재 ${statusText[staff.status]} 상태입니다.`
      );
      return;
    }
    const holidayInfo = holidays.find(h => h.date === data.date);
    if (holidayInfo) {
      toast.error(
        `${holidayInfo.name}은 매장 휴일입니다. 다른 날짜를 선택해주세요.`
      );
      return;
    }

    await registerAttendance(data);

    setIsScheduleModalOpen(false);
    setSelectedStaffForForm('');
  };

  const navigateDay = (dir: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (dir === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  // =====================
  // 📌 근무상세 열기
  // =====================
  const handleOpenDetail = async (attendanceId: number) => {
    try {
      setIsDetailOpen(true);
      setDetailLoading(true);

      const baseUrl = import.meta.env.VITE_BACKEND_API_BASE_URL;
      const token = localStorage.getItem('accessToken');

      const res = await axios.get<AttendanceDetail>(
        `${baseUrl}/api/attendance/detail/${attendanceId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setAttendanceDetail(res.data);
    } catch (e: any) {
      console.error('📌 근무상세 조회 실패', e?.response?.data || e);
      toast.error(
        e?.response?.data?.message || '근무상세 정보를 불러오지 못했습니다.'
      );
      setAttendanceDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setAttendanceDetail(null);
  };

  // ⭐ 근무 수정 폼 열기
  const handleOpenEdit = async (attendanceId: number) => {
    try {
      setEditLoading(true);

      const baseUrl = import.meta.env.VITE_BACKEND_API_BASE_URL;
      const token = localStorage.getItem('accessToken');

      const res = await axios.get<AttendanceModifyForm>(
        `${baseUrl}/api/attendance/modify/${attendanceId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const dto = res.data;

      const toTime = (dt: string | null) =>
        dt && dt.length >= 16 ? dt.substring(11, 16) : '';

      const initial: FormValues = {
        staffId: String(dto.staffId),
        date: dto.attendanceWorkDate,
        attendanceCheckIn: toTime(dto.attendanceCheckIn),
        attendanceCheckOut: toTime(dto.attendanceCheckOut),
        attendanceStatus: dto.attendanceStatus,
        attendanceWorkHours: dto.attendanceWorkHours ?? '',
        notes: dto.attendanceMemo ?? '',
      };

      setEditInitialData(initial);
      setEditTargetId(attendanceId);
      setIsEditModalOpen(true);
    } catch (e: any) {
      console.error('📌 근태 수정 폼 조회 실패', e?.response?.data || e);
      toast.error(
        e?.response?.data?.message || '근태 수정 정보를 불러오지 못했습니다.'
      );
      setEditInitialData(null);
      setEditTargetId(null);
      setIsEditModalOpen(false);
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditSubmit = async (data: any) => {
    if (!editTargetId) {
      toast.error('수정할 근태 정보를 찾을 수 없습니다.');
      return;
    }
    await updateAttendance(editTargetId, data);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            근무 일정 / 근태 관리
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            직원들의 출퇴근(근태)과 근무 일정을 함께 관리합니다
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsScheduleModalOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> 근태 추가
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
                    const value = e.target.value;
                    setAttendanceKeyword(value);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
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

              <Select
                value={attendanceStatusFilter}
                onValueChange={v => setAttendanceStatusFilter(v)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="근태 상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체</SelectItem>
                  <SelectItem value="NORMAL">정상</SelectItem>
                  <SelectItem value="LATE">지각</SelectItem>
                  <SelectItem value="EARLY_LEAVE">조퇴</SelectItem>
                  <SelectItem value="ABSENT">결근</SelectItem>
                  <SelectItem value="VACATION">휴가</SelectItem>
                  <SelectItem value="HOLIDAY">휴일</SelectItem>
                  <SelectItem value="RESIGN">퇴사</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 날짜 네비게이션 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => navigateDay('prev')}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> 이전 날
            </Button>
            <h2 className="font-semibold">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월{' '}
              {currentDate.getDate()}일 ({dayNames[currentDate.getDay()]})
            </h2>
            <Button
              variant="outline"
              onClick={() => navigateDay('next')}
              className="gap-2"
            >
              다음 날 <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 하루 리스트 뷰 (근태) */}
      <Card>
        <CardContent className="p-6 space-y-3">
          {attendanceLoading ? (
            <div className="text-sm text-gray-500 px-1">
              근태 데이터를 불러오는 중입니다...
            </div>
          ) : attendanceList.length > 0 ? (
            <>
              <h3 className="font-semibold mb-2">근무(근태) 일정</h3>

              <div className="space-y-4">
                {attendanceList.map((item, index) => (
                  <Card
                    key={item.attendanceId ?? index}
                    className="p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      {/* 왼쪽: 직원 정보 + 근태 정보 */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div>
                            <h4 className="font-semibold">{item.staffName}</h4>
                            <p className="text-sm text-dark-gray">
                              {getEmploymentTypeLabel(
                                item.staffEmploymentType
                              )}
                            </p>
                          </div>
                          {getAttendanceStatusBadge(item.attendanceStatus)}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4 text-sm">
                          <div>
                            <p className="text-dark-gray">근무일자</p>
                            <p className="font-semibold">
                              {item.attendanceWorkDate}
                            </p>
                          </div>
                          <div>
                            <p className="text-dark-gray">출근시간</p>
                            <p className="font-semibold">
                              {formatTime(item.attendanceCheckIn)}
                            </p>
                          </div>
                          <div>
                            <p className="text-dark-gray">퇴근시간</p>
                            <p className="font-semibold">
                              {formatTime(item.attendanceCheckOut)}
                            </p>
                          </div>
                          <div>
                            <p className="text-dark-gray">실제 근무시간</p>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">
                                {formatWorkHoursLabel(
                                  item.attendanceWorkHours
                                )}
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                className="ml-3"
                                onClick={() =>
                                  handleOpenDetail(item.attendanceId)
                                }
                              >
                                근무상세
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleOpenEdit(item.attendanceId)
                                }
                                disabled={editLoading}
                              >
                                수정
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={attendancePage <= 0}
                  onClick={() => {
                    const prev = attendancePage - 1;
                    setAttendancePage(prev);
                    loadAttendance(currentDate, prev);
                  }}
                >
                  이전
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={attendancePage + 1 >= attendanceTotalPages}
                  onClick={() => {
                    const next = attendancePage + 1;
                    setAttendancePage(next);
                    loadAttendance(currentDate, next);
                  }}
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

      {/* 근태 입력 모달 (신규 등록) */}
      <FormModal
        key="add-schedule"
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setSelectedStaffForForm('');
        }}
        onSubmit={handleAddSchedule}
        title="근무 일정 / 근태 추가"
        fields={scheduleFormFields(selectedStaffForForm)}
        initialData={{ date: todayStr }}
        onChange={(field, value) => {
          if (field === 'staffId')
            setSelectedStaffForForm(String(value ?? ''));
        }}
      />

      {/* ⭐ 근태 수정 모달 */}
      <FormModal
        key={editTargetId ? `edit-${editTargetId}` : 'edit'}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditTargetId(null);
          setEditInitialData(null);
          setSelectedStaffForForm('');
        }}
        onSubmit={handleEditSubmit}
        title="근무 일정 / 근태 수정"
        fields={scheduleFormFields(selectedStaffForForm)}
        initialData={editInitialData || undefined}
        onChange={(field, value) => {
          if (field === 'staffId')
            setSelectedStaffForForm(String(value ?? ''));
        }}
      />

      {/* ✅ 근무상세 모달 */}
      {isDetailOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg mx-4 p-6 relative">
            <button
              type="button"
              onClick={handleCloseDetail}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-semibold mb-4">근무상세</h3>

            {detailLoading ? (
              <p className="text-sm text-gray-500">
                상세 정보를 불러오는 중입니다...
              </p>
            ) : attendanceDetail ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">직원명</span>
                  <span className="font-semibold">
                    {attendanceDetail.staffName} (
                    {getEmploymentTypeLabel(
                      attendanceDetail.staffEmploymentType
                    )}
                    )
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">근무일자</span>
                  <span className="font-semibold">
                    {attendanceDetail.attendanceWorkDate}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">출근시간</span>
                  <span className="font-semibold">
                    {formatTime(attendanceDetail.attendanceCheckIn)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">퇴근시간</span>
                  <span className="font-semibold">
                    {formatTime(attendanceDetail.attendanceCheckOut)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-500">근태 상태</span>
                  <span className="font-semibold">
                    {getAttendanceStatusBadge(
                      attendanceDetail.attendanceStatus
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">실제 근무시간</span>
                  <span className="font-semibold">
                    {formatWorkHoursLabel(
                      attendanceDetail.attendanceWorkHours
                    )}
                  </span>
                </div>

                <div>
                  <p className="text-gray-500 mb-1">근태 메모 / 사유</p>
                  <p className="text-sm whitespace-pre-wrap border rounded-md px-3 py-2 bg-gray-50 min-h-[60px]">
                    {attendanceDetail.attendanceMemo &&
                    attendanceDetail.attendanceMemo.trim().length > 0
                      ? attendanceDetail.attendanceMemo
                      : '등록된 메모가 없습니다.'}
                  </p>
                </div>

                <div className="flex justify-end mt-4">
                  <Button variant="outline" onClick={handleCloseDetail}>
                    닫기
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-red-500">
                근무상세 정보를 찾을 수 없습니다.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
