import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus, Search, Edit, Users, Calendar,
  UserCheck, UserMinus
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '../ui/select';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { FormModal } from '../Common/FormModal';
import { toast } from 'sonner';

/* ---------- FormModal 필드 타입 ---------- */
type UIFieldType =
  | 'number' | 'text' | 'select' | 'email' | 'date'
  | 'textarea' | 'time' | 'password' | 'file' | 'tel' | 'month';

type BaseField = {
  name: string;
  label: string;
  required: boolean;
};

type ModalField =
  | (BaseField & {
    type: Exclude<UIFieldType, 'select'>;
    placeholder?: string;
    options?: never;
  })
  | (BaseField & {
    type: 'select';
    options: { value: string; label: string }[];
  });
/* ---------------------------------------------------------------------- */

/* ---------- Staff 인터페이스 ---------- */
interface Staff {
  id: number;
  staffName: string;
  staffBirth: string;
  staffEmploymentType: string;
  staffStartDate: string;
  attendanceStatus: string;
  staffPhone: string;
  staffEmail?: string;
}

/* ---------- 컴포넌트 ---------- */
export function StaffList() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAttendance, setFilterAttendance] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // ✅ 날짜 포맷 변환 (LocalDateTime 대응)
  const toDateTime = (v: string) =>
    v && v.length === 10 ? `${v}T00:00:00` : v;

  /* ✅ 직원 목록 불러오기 */
  useEffect(() => {
    const fetchStaffList = async () => {
      try {
        const baseUrl = import.meta.env.VITE_BACKEND_API_BASE_URL;
        const token = localStorage.getItem('accessToken');
        const res = await axios.get<Staff[]>(`${baseUrl}/api/staff/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStaff(res.data);
      } catch {
        toast.error('직원 목록을 불러오지 못했습니다.');
      }
    };
    fetchStaffList();
  }, []);

  /* ✅ 등록 처리 */
  const handleAddStaff = async (data: any) => {
    try {
      const baseUrl = import.meta.env.VITE_BACKEND_API_BASE_URL;
      const token = localStorage.getItem('accessToken');

      const payload = {
        staffName: data.staffName,
        staffEmploymentType: data.staffEmploymentType,
        staffEmail: data.staffEmail || null,
        staffPhone: data.staffPhone,
        staffBirth: toDateTime(data.staffBirth),
        staffStartDate: toDateTime(data.staffStartDate),
      };

      const res = await axios.post<number>(`${baseUrl}/api/staff/add`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 목록 재조회
      const listRes = await axios.get<Staff[]>(`${baseUrl}/api/staff/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStaff(listRes.data);

      setIsAddModalOpen(false);
      toast.success(`직원이 등록되었습니다. (ID: ${res.data})`);
    } catch (err: any) {
      console.error(err?.response?.data ?? err);
      toast.error('직원 등록에 실패했습니다.');
    }
  };

  /* ✅ 수정 처리 (로컬 상태만 변경 — 필요 시 PUT으로 확장 가능) */
  const handleEditStaff = (data: any) => {
    setStaff(prev =>
      prev.map(m => (m.id === editingStaff?.id ? { ...m, ...data } : m))
    );
    setEditingStaff(null);
    toast.success('직원 정보가 수정되었습니다.');
  };

  /* ✅ 필터링 */
  const filteredStaff = staff.filter(staffMember => {
    const matchesSearch =
      staffMember.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffMember.staffEmploymentType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAttendance =
      filterAttendance === 'all' ||
      staffMember.attendanceStatus === filterAttendance;

    return matchesSearch && matchesAttendance;
  });

  /* ✅ 근태 상태 뱃지 */
  const getAttendanceBadge = (attendanceStatus?: string | null) => {
  if (!attendanceStatus) return null;  // ← 아무것도 출력하지 않음

  const status = attendanceStatus.toUpperCase();
  switch (status) {
    case 'ACTIVE':
    case 'WORKING':
      return <Badge className="bg-green-100 text-green-800">근무중</Badge>;
    case 'RESIGNED':
    case 'QUIT':
      return <Badge className="bg-red-100 text-red-800">퇴사</Badge>;
    default:
      return <Badge>{attendanceStatus}</Badge>;
  }
};


  /* ✅ 등록 모달 필드 */
  const staffAddFormFields: ModalField[] = [
    { name: 'staffName', label: '이름', type: 'text', required: true },
    { name: 'staffBirth', label: '생년월일', type: 'date', required: true },
    {
      name: 'staffPhone',
      label: '연락처',
      type: 'tel',
      required: true,
      placeholder: '010-1234-5678',
    },
    {
      name: 'staffEmail',
      label: '이메일',
      type: 'email',
      required: true,
      placeholder: 'example@email.com',
    },
    { name: 'staffStartDate', label: '입사일', type: 'date', required: true },
    {
      name: 'staffEmploymentType',
      label: '직책',
      type: 'select',
      required: true,
      options: [
        { value: 'OWNER', label: '점주' },
        { value: 'WORKER', label: '직원' },
        { value: 'PART_TIMER', label: '알바' },
      ],
    },
  ];

  /* ✅ 렌더링 */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-kpi-purple" />
          <h1>직원 목록</h1>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          직원 추가
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-kpi-purple" />
            <div>
              <p className="text-sm text-dark-gray">전체 직원</p>
              <p className="text-2xl font-semibold">{staff.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <UserCheck className="w-6 h-6 text-kpi-green" />
            <div>
              <p className="text-sm text-dark-gray">근무중</p>
              <p className="text-2xl font-semibold">
                {staff.filter(s => s.attendanceStatus === 'active').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <UserMinus className="w-6 h-6 text-kpi-red" />
            <div>
              <p className="text-sm text-dark-gray">퇴사</p>
              <p className="text-2xl font-semibold">
                {staff.filter(s => s.attendanceStatus === 'resigned').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="이름, 직책 검색..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterAttendance} onValueChange={setFilterAttendance}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="상태 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="active">근무중</SelectItem>
              <SelectItem value="resigned">퇴사</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Staff List */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredStaff.map(staff => (
              <Card key={staff.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback>{staff.staffName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{staff.staffName}</h3>
                        <p className="text-sm text-dark-gray">
                          {staff.staffEmploymentType}
                        </p>
                      </div>
                      {getAttendanceBadge(staff.attendanceStatus)}
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-dark-gray">
                      <div>생년월일: {staff.staffBirth}</div>
                      <div>전화번호: {staff.staffPhone}</div>
                      <div>입사일: {staff.staffStartDate}</div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingStaff(staff)}
                        className="gap-1"
                      >
                        <Edit className="w-3 h-3" /> 수정
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {filteredStaff.length === 0 && (
            <div className="text-center py-8 text-dark-gray">
              검색 조건에 맞는 직원이 없습니다.
            </div>
          )}
        </div>
      </Card>

      {/* Add Staff Modal */}
      <FormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddStaff}
        title="직원 추가"
        fields={staffAddFormFields}
      />

      {/* Edit Staff Modal */}
      <FormModal
        isOpen={!!editingStaff}
        onClose={() => setEditingStaff(null)}
        onSubmit={handleEditStaff}
        title="직원 정보 수정"
        fields={staffAddFormFields}
        initialData={
          editingStaff
            ? (editingStaff as unknown as Record<string, unknown>)
            : undefined
        }
      />
    </div>
  );
}

export default StaffList;
