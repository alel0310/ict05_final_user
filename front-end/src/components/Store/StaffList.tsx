import React, { useState } from 'react';
import { Plus, Search, Filter, Edit, Users, Phone, Mail, Calendar, UserCheck, UserMinus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { FormModal } from '../Common/FormModal';
// ❌ import type { FormField } from '../Common/FormModal';  // 제거
import { DownloadToggle } from '../Common/DownloadToggle';
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
  id: string;
  name: string;
  position: string;
  department: string;
  phone: string;
  email: string;
  hireDate: string;
  resignationDate?: string;
  status: 'active' | 'inactive' | 'vacation' | 'resigned';
  avatar?: string;
}

const mockStaff: Staff[] = [
  { id: '1', name: '김철수', position: '매장 매니저', department: '운영팀', phone: '010-1234-5678', email: 'kim@store.com', hireDate: '2023-01-15', status: 'active' },
  { id: '2', name: '이영희', position: '주방장', department: '주방팀', phone: '010-2345-6789', email: 'lee@store.com', hireDate: '2023-03-20', status: 'active' },
  { id: '3', name: '박민수', position: '홀 서빙', department: '서비스팀', phone: '010-3456-7890', email: 'park@store.com', hireDate: '2023-06-10', status: 'vacation' },
  { id: '4', name: '최지은', position: '캐셔', department: '서비스팀', phone: '010-4567-8901', email: 'choi@store.com', hireDate: '2023-08-05', resignationDate: '2024-01-15', status: 'resigned' },
  { id: '5', name: '정수빈', position: '주방보조', department: '주방팀', phone: '010-5678-9012', email: 'jung@store.com', hireDate: '2023-09-15', status: 'inactive' },
  { id: '6', name: '강민호', position: '부매장장', department: '운영팀', phone: '010-6789-0123', email: 'kang@store.com', hireDate: '2023-02-10', status: 'active' },
  { id: '7', name: '윤서연', position: '주방 팀장', department: '주방팀', phone: '010-7890-1234', email: 'yoon@store.com', hireDate: '2023-04-08', status: 'active' },
  { id: '8', name: '한지우', position: '홀 서빙', department: '서비스팀', phone: '010-8901-2345', email: 'han@store.com', hireDate: '2024-01-20', status: 'active' },
  { id: '9', name: '송예린', position: '음료 바리스타', department: '서비스팀', phone: '010-9012-3456', email: 'song@store.com', hireDate: '2024-02-15', status: 'active' },
  { id: '10', name: '임도현', position: '주방보조', department: '주방팀', phone: '010-0123-4567', email: 'lim@store.com', hireDate: '2024-03-05', status: 'vacation' }
];

export function StaffList() {
  const [staff, setStaff] = useState<Staff[]>(mockStaff);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const filteredStaff = staff.filter(member => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus;
    const matchesDepartment = filterDepartment === 'all' || member.department === filterDepartment;
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':   return <Badge className="bg-green-100 text-green-800">근무중</Badge>;
      case 'inactive': return <Badge className="bg-gray-100 text-gray-800">휴직중</Badge>;
      case 'vacation': return <Badge className="bg-blue-100 text-blue-800">휴가중</Badge>;
      case 'resigned': return <Badge className="bg-red-100 text-red-800">퇴사</Badge>;
      default:         return <Badge>{status}</Badge>;
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
    { name: 'phone', label: '전화번호', type: 'text', required: true },
    { name: 'email', label: '이메일', type: 'email', required: true },
    { name: 'hireDate', label: '입사일', type: 'date', required: true },
    {
      name: 'status', label: '상태', type: 'select', required: true,
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
    { name: 'phone', label: '전화번호', type: 'text', required: true },
    { name: 'email', label: '이메일', type: 'email', required: true },
    { name: 'hireDate', label: '입사일', type: 'date', required: true },
    { name: 'resignationDate', label: '퇴사일', type: 'date', required: false },
    {
      name: 'status', label: '상태', type: 'select', required: true,
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

  const handleDownload = async (format: 'excel' | 'pdf') => {
    try {
      await new Promise(r => setTimeout(r, 1500));
      if (!filteredStaff || filteredStaff.length === 0) throw new Error('다운로드할 직원 데이터가 없습니다.');

      const exportData = filteredStaff.map(member => ({
        이름: member.name || '-',
        직책: member.position || '-',
        부서: member.department || '-',
        전화번호: member.phone || '-',
        이메일: member.email || '-',
        입사일: member.hireDate || '-',
        퇴사일: member.resignationDate || '-',
        상태: getStatusText(member.status)
      }));

      if (format === 'excel') {
        const csvContent = [
          Object.keys(exportData[0]).join(','),
          ...exportData.map(row => Object.values(row).map(v => `"${v}"`).join(','))
        ].join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `직원목록_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
      } else {
        const reportWindow = window.open('', '_blank');
        const htmlContent = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>직원 목록 보고서</title>
<style>@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Noto Sans KR',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;color:#333;background:#fff;padding:40px}.header{text-align:center;margin-bottom:40px;border-bottom:3px solid #14213D;padding-bottom:20px}.header h1{color:#14213D;font-size:28px;font-weight:700;margin-bottom:10px}.header-info{color:#666;font-size:14px}.summary{background:linear-gradient(135deg,#f8f9fa 0%,#e9ecef 100%);padding:20px;border-radius:12px;margin-bottom:30px;border-left:5px solid #9D4EDD}.summary h2{color:#14213D;font-size:18px;margin-bottom:10px;font-weight:600}.summary-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px}.summary-item{background:#fff;padding:15px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,.1)}.summary-label{font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px}.summary-value{font-size:18px;font-weight:600;color:#14213D}.staff-grid{display:grid;gap:20px}.staff-card{border:1px solid #e0e0e0;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.05)}.staff-header{background:linear-gradient(135deg,#14213D 0%,#1a2b4d 100%);color:#fff;padding:16px 20px;font-weight:600;font-size:16px}.staff-content{padding:20px}.staff-details{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px}.detail-item{display:flex;flex-direction:column}.detail-label{font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;font-weight:500}.detail-value{font-size:14px;color:#333;font-weight:500}.status-badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}.status-active{background:#d4edda;color:#155724}.status-inactive{background:#e2e3e5;color:#383d41}.status-leave{background:#fff3cd;color:#856404}.footer{margin-top:40px;text-align:center;color:#666;font-size:12px;border-top:1px solid #eee;padding-top:20px}@media print{body{padding:20px}.staff-card{break-inside:avoid}.header{break-after:avoid}}@page{margin:2cm;size:A4}</style></head>
<body><div class="header"><h1>👥 직원 목록 보고서</h1><div class="header-info"><div>생성일시: ${new Date().toLocaleString('ko-KR')}</div></div></div>
<div class="summary"><h2>📊 보고서 요약</h2><div class="summary-grid"><div class="summary-item"><div class="summary-label">총 직원 수</div><div class="summary-value">${exportData.length}명</div></div><div class="summary-item"><div class="summary-label">보고서 생성</div><div class="summary-value">${new Date().toLocaleDateString('ko-KR')}</div></div><div class="summary-item"><div class="summary-label">생성 시간</div><div class="summary-value">${new Date().toLocaleTimeString('ko-KR')}</div></div></div></div>
<div class="staff-grid">${
  exportData.map((member, i) => `
  <div class="staff-card">
    <div class="staff-header">#${i + 1} ${member.이름} (${member.직책})</div>
    <div class="staff-content">
      <div class="staff-details">
        <div class="detail-item"><div class="detail-label">부서</div><div class="detail-value">${member.부서}</div></div>
        <div class="detail-item"><div class="detail-label">전화번호</div><div class="detail-value">${member.전화번호}</div></div>
        <div class="detail-item"><div class="detail-label">이메일</div><div class="detail-value">${member.이메일}</div></div>
        <div class="detail-item"><div class="detail-label">입사일</div><div class="detail-value">${member.입사일}</div></div>
        ${member.퇴사일 !== '-' ? `<div class="detail-item"><div class="detail-label">퇴사일</div><div class="detail-value">${member.퇴사일}</div></div>` : ''}
        <div class="detail-item"><div class="detail-label">상태</div><div class="detail-value"><span class="status-badge ${member.상태 === '재직' ? 'status-active' : member.상태 === '휴직' ? 'status-leave' : 'status-inactive'}">${member.상태}</span></div></div>
      </div>
    </div>
  </div>`).join('')
}</div>
<div class="footer"><div>FranFriend ERP System - 직원 관리 보고서</div><div>본 보고서는 ${new Date().toLocaleString('ko-KR')}에 자동 생성되었습니다.</div></div>
<script>window.onload=function(){setTimeout(()=>{window.print()},500)}</script></body></html>`;
        if (reportWindow) { reportWindow.document.write(htmlContent); reportWindow.document.close(); }
      }
    } catch (e) {
      console.error('Download error:', e);
      throw e;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '근무중';
      case 'vacation': return '휴가중';
      case 'inactive': return '휴직중';
      case 'resigned': return '퇴사';
      default: return '알수없음';
    }
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
          <DownloadToggle onDownload={handleDownload} filename={`직원목록_${new Date().toISOString().split('T')[0]}`} />
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
              <p className="text-2xl font-semibold">{staff.filter(s => s.status === 'active').length}</p>
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
              <p className="text-2xl font-semibold">{staff.filter(s => s.status === 'vacation').length}</p>
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
              <p className="text-2xl font-semibold">{staff.filter(s => s.status === 'inactive').length}</p>
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
              <p className="text-2xl font-semibold">{staff.filter(s => s.status === 'resigned').length}</p>
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
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="상태 필터" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="active">근무중</SelectItem>
              <SelectItem value="vacation">휴가중</SelectItem>
              <SelectItem value="inactive">휴직중</SelectItem>
              <SelectItem value="resigned">퇴사</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="부서 필터" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 부서</SelectItem>
              <SelectItem value="운영팀">운영팀</SelectItem>
              <SelectItem value="주방팀">주방팀</SelectItem>
              <SelectItem value="서비스팀">서비스팀</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Staff List */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredStaff.map(member => (
              <Card key={member.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{member.name}</h3>
                        <p className="text-sm text-dark-gray">{member.position} · {member.department}</p>
                      </div>
                      {getStatusBadge(member.status)}
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-dark-gray"><Phone className="w-4 h-4" />{member.phone}</div>
                      <div className="flex items-center gap-2 text-sm text-dark-gray"><Mail className="w-4 h-4" />{member.email}</div>
                      <div className="flex items-center gap-2 text-sm text-dark-gray"><Calendar className="w-4 h-4" />입사일: {member.hireDate}</div>
                      {member.resignationDate && (<div className="flex items-center gap-2 text-sm text-dark-gray"><Calendar className="w-4 h-4" />퇴사일: {member.resignationDate}</div>)}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => setEditingStaff(member)} className="gap-1">
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
}
