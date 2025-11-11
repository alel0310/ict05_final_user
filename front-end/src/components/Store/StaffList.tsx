import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Filter, Edit, Users, Phone, Mail, Calendar, UserCheck, UserMinus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { FormModal } from '../Common/FormModal';
import { toast } from 'sonner';

/* ---------- 로컬 타입: FormModal이 기대하는 필드 모양을 동일하게 정의 ---------- */
type UIFieldType =
  | 'number' | 'text' | 'select' | 'email' | 'date'
  | 'textarea' | 'time' | 'password' | 'file' | 'tel' | 'month';

type ModalField =
  | {
      name: string;
      label: string;
      required: boolean;
      type: Exclude<UIFieldType, 'select'>;
      options?: never;
    }
  | {
      name: string;
      label: string;
      required: boolean;
      type: 'select';
      options: { value: string; label: string }[];
    };
/* ---------------------------------------------------------------------- */

interface Staff {
  id: number;
  staffName: string;
  staffBirth: string;
  staffDepartment: string;
  staffEmploymentType: string;
  staffStartDate: string;
  attendanceStatus: string;
}

export function StaffList() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterAttendance, setFilterAttendance] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_BACKEND_API_BASE_URL; // ← 여기서 환경 변수 읽기

    axios
      .get<Staff[]>(`${baseUrl}/api/staff/list`) // ← baseUrl + /api/staff/list
      .then(res => setStaff(res.data))
      .catch(() => toast.error('직원 목록을 불러오지 못했습니다.'));
  }, []);

  /* ✅ 필터링 로직 */
  const filteredStaff = staff.filter(staffMember => {
  const matchesSearch =
    staffMember.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staffMember.staffDepartment.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staffMember.staffEmploymentType.toLowerCase().includes(searchTerm.toLowerCase());

  const matchesDepartment =
    filterDepartment === 'all' || staffMember.staffDepartment === filterDepartment;

  const matchesAttendance =
    filterAttendance === 'all' || staffMember.attendanceStatus === filterAttendance;

  return matchesSearch && matchesDepartment && matchesAttendance;
});


 /* ✅ 근태 상태 뱃지 표시 */
const getAttendanceBadge = (attendanceStatus?: string | null) => {
  if (!attendanceStatus) {
    return <Badge className="bg-gray-100 text-gray-800">상태 없음</Badge>;
  }

  // 대소문자 섞여 들어와도 처리되게 통일
  const status = attendanceStatus.toUpperCase();

  switch (status) {
    // 근무 중
    case 'ACTIVE':
    case 'WORKING':
      return <Badge className="bg-green-100 text-green-800">근무중</Badge>;

    // 휴가
    case 'VACATION':
      return <Badge className="bg-blue-100 text-blue-800">휴가중</Badge>;

    // 휴직 (inactive / leave 둘 다 휴직으로 봄)
    case 'LEAVE':
    case 'INACTIVE':
      return <Badge className="bg-gray-100 text-gray-800">휴직중</Badge>;

    // 퇴사
    case 'RESIGNED':
    case 'QUIT':
      return <Badge className="bg-red-100 text-red-800">퇴사</Badge>;

    // 그 외 예상 못한 값들
    default:
      return <Badge>{attendanceStatus}</Badge>;
  }
};

  /* ---------- 폼 필드: 로컬 타입 사용 ---------- */
  const staffAddFormFields: ModalField[] = [
    { name: 'name', label: '이름', type: 'text', required: true },
    { name: 'position', label: '직책', type: 'text', required: true },
    {
      name: 'department', label: '부서', type: 'select', required: true,
      options: [
        { value: '운영팀', label: '운영팀' },
        { value: '주방팀', label: '주방팀' },
        { value: '서비스팀', label: '서비스팀' }
      ]
    },
    { name: 'hireDate', label: '입사일', type: 'date', required: true },
    {
      name: 'attendanceStatus', label: '상태', type: 'select', required: true,
      options: [
        { value: 'active', label: '근무중' },
        { value: 'inactive', label: '휴직중' },
        { value: 'vacation', label: '휴가중' },
        { value: 'resigned', label: '퇴사' }
      ]
    }
  ];

  const staffEditFormFields: ModalField[] = [
    { name: 'name', label: '이름', type: 'text', required: true },
    { name: 'position', label: '직책', type: 'text', required: true },
    {
      name: 'department', label: '부서', type: 'select', required: true,
      options: [
        { value: '운영팀', label: '운영팀' },
        { value: '주방팀', label: '주방팀' },
        { value: '서비스팀', label: '서비스팀' }
      ]
    },

    { name: 'hireDate', label: '입사일', type: 'date', required: true },
    { name: 'resignationDate', label: '퇴사일', type: 'date', required: false },
    {
      name: 'attendanceStatus', label: '상태', type: 'select', required: true,
      options: [
        { value: 'active', label: '근무중' },
        { value: 'inactive', label: '휴직중' },
        { value: 'vacation', label: '휴가중' },
        { value: 'resigned', label: '퇴사' }
      ]
    }
  ];
  /* ------------------------------------------------ */

  const handleAddStaff = (data: any) => {
    const newStaff: Staff = { id: Date.now().toString(), ...data };
    setStaff(prev => [...prev, newStaff]);
    setIsAddModalOpen(false);
    toast.success('직원이 추가되었습니다.');
  };

  const handleEditStaff = (data: any) => {
    setStaff(prev => prev.map(m => (m.id === editingStaff?.id ? { ...m, ...data } : m)));
    setEditingStaff(null);
    toast.success('직원 정보가 수정되었습니다.');
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-kpi-purple" />
          <h1>직원 목록</h1>
        </div>
        <div className="flex gap-2">

          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            직원 추가
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-kpi-purple/10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-kpi-purple" />
            </div>
            <div>
              <p className="text-sm text-dark-gray">전체 직원</p>
              <p className="text-2xl font-semibold">{staff.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-kpi-green/10 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-kpi-green" />
            </div>
            <div>
              <p className="text-sm text-dark-gray">근무중</p>
              <p className="text-2xl font-semibold">{staff.filter(s => s.attendanceStatus === 'active').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-kpi-orange/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-kpi-orange" />
            </div>
            <div>
              <p className="text-sm text-dark-gray">휴가중</p>
              <p className="text-2xl font-semibold">{staff.filter(s => s.attendanceStatus === 'vacation').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-dark-gray">휴직중</p>
              <p className="text-2xl font-semibold">{staff.filter(s => s.attendanceStatus === 'inactive').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-kpi-red/10 rounded-lg flex items-center justify-center">
              <UserMinus className="w-6 h-6 text-kpi-red" />
            </div>
            <div>
              <p className="text-sm text-dark-gray">퇴사</p>
              <p className="text-2xl font-semibold">{staff.filter(s => s.attendanceStatus === 'resigned').length}</p>
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
              <Input placeholder="이름, 직책, 부서로 검색..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>
          <Select value={filterAttendance} onValueChange={setFilterAttendance}>
            <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="상태 필터" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="active">근무중</SelectItem>
              <SelectItem value="vacation">휴가중</SelectItem>
              <SelectItem value="inactive">휴일</SelectItem>
              <SelectItem value="resigned">퇴사</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="부서 필터" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 부서</SelectItem>
              <SelectItem value="본사팀">본사팀</SelectItem>
              <SelectItem value="판매팀">판매팀</SelectItem>
              <SelectItem value="가맹관리팀">가맹관리팀</SelectItem>
              <SelectItem value="운영지원팀">운영지원팀</SelectItem>
              <SelectItem value="인사팀">인사팀</SelectItem>
              <SelectItem value="데이터분석팀">데이터분석팀</SelectItem>
              <SelectItem value="관리팀">관리팀</SelectItem>
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
                    {/* <AvatarImage src={member.avatar} alt={member.staffName} /> */}
                    <AvatarFallback>{staff.staffName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{staff.staffName}</h3>
                        <p className="text-sm text-dark-gray">{staff.staffDepartment} · {staff.staffEmploymentType}</p>
                      </div>
                      {getAttendanceBadge(staff.attendanceStatus)}
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-dark-gray"><Calendar className="w-4 h-4" />이름: {staff.staffName}</div>
                      <div className="flex items-center gap-2 text-sm text-dark-gray"><Calendar className="w-4 h-4" />생년월일: {staff.staffBirth}</div>
                      <div className="flex items-center gap-2 text-sm text-dark-gray"><Calendar className="w-4 h-4" />부서: {staff.staffDepartment}</div>
                      <div className="flex items-center gap-2 text-sm text-dark-gray"><Calendar className="w-4 h-4" />직책: {staff.staffEmploymentType}</div>
                      <div className="flex items-center gap-2 text-sm text-dark-gray"><Calendar className="w-4 h-4" />입사일: {staff.staffStartDate}</div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => setEditingStaff(staff)} className="gap-1">
                        <Edit className="w-3 h-3" />수정
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {filteredStaff.length === 0 && <div className="text-center py-8 text-dark-gray">검색 조건에 맞는 직원이 없습니다.</div>}
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
        fields={staffEditFormFields}
        initialData={editingStaff ? (editingStaff as unknown as Record<string, unknown>) : undefined}
      />
    </div>
  );
};
export default StaffList;
