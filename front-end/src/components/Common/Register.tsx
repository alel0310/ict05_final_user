import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Store, 
  Lock, 
  Mail, 
  Users, 
  User, 
  Phone, 
  MapPin,
  Building2,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

interface RegisterProps {
  onRegister: (userType: 'HQ' | 'Store', userData: any) => void;
  onBackToLogin: () => void;
}

export function Register({ onRegister, onBackToLogin }: RegisterProps) {
  const [userType, setUserType] = useState<'HQ' | 'Store'>('Store');
  const [formData, setFormData] = useState({
    // 공통 필드
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    
    // 본사 전용
    hqName: '',
    businessNumber: '',
    
    // 가맹점 전용
    storeName: '',
    address: '',
    region: '',
    ownerName: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 에러 메시지 클리어
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // 공통 검증
    if (!formData.email) newErrors.email = '이메일을 입력해주세요.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.';
    }

    if (!formData.password) newErrors.password = '비밀번호를 입력해주세요.';
    else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다.';
    }

    if (!formData.confirmPassword) newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
    else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    if (!formData.name) newErrors.name = '이름을 입력해주세요.';
    if (!formData.phone) newErrors.phone = '연락처를 입력해주세요.';

    // 본사 전용 검증
    if (userType === 'HQ') {
      if (!formData.hqName) newErrors.hqName = '본사명을 입력해주세요.';
      if (!formData.businessNumber) newErrors.businessNumber = '사업자등록번호를 입력해주세요.';
    }

    // 가맹점 전용 검증
    if (userType === 'Store') {
      if (!formData.storeName) newErrors.storeName = '매장명을 입력해주세요.';
      if (!formData.address) newErrors.address = '주소를 입력해주세요.';
      if (!formData.region) newErrors.region = '지역을 선택해주세요.';
      if (!formData.ownerName) newErrors.ownerName = '점주명을 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // 회원가입 처리
      const userData = {
        ...formData,
        userType,
        registeredAt: new Date().toISOString()
      };
      
      onRegister(userType, userData);
      toast.success('회원가입이 완료되었습니다!');
    }
  };

  const regions = [
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', 
    '세종', '경기', '강원', '충북', '충남', '전북', '전남', 
    '경북', '경남', '제주'
  ];

  return (
    <div className="min-h-screen bg-light-gray flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-8 bg-white rounded-xl shadow-lg">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToLogin}
            className="mr-2 p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 text-center">
            <div className="w-12 h-12 bg-kpi-purple rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">회원가입</h1>
            <p className="text-sm text-dark-gray">FranFriend ERP 계정을 생성하세요</p>
          </div>
        </div>

        {/* User Type Selection */}
        <div className="mb-6">
          <Label className="text-sm font-medium text-gray-700 mb-3 block">가입 유형</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setUserType('HQ')}
              className={`p-3 rounded-lg border-2 transition-all ${
                userType === 'HQ'
                  ? 'border-kpi-red bg-kpi-red text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-kpi-red'
              }`}
            >
              <Building2 className="w-4 h-4 mx-auto mb-1" />
              <span className="text-sm font-medium">본사</span>
            </button>
            <button
              type="button"
              onClick={() => setUserType('Store')}
              className={`p-3 rounded-lg border-2 transition-all ${
                userType === 'Store'
                  ? 'border-kpi-green bg-kpi-green text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-kpi-green'
              }`}
            >
              <Store className="w-4 h-4 mx-auto mb-1" />
              <span className="text-sm font-medium">가맹점</span>
            </button>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 공통 필드 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                이름 <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="w-4 h-4 text-dark-gray absolute left-3 top-1/2 transform -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="이름"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`pl-9 h-10 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                />
              </div>
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                연락처 <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Phone className="w-4 h-4 text-dark-gray absolute left-3 top-1/2 transform -translate-y-1/2" />
                <Input
                  type="tel"
                  placeholder="010-0000-0000"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`pl-9 h-10 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              이메일 <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Mail className="w-4 h-4 text-dark-gray absolute left-3 top-1/2 transform -translate-y-1/2" />
              <Input
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`pl-9 h-10 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              />
            </div>
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                비밀번호 <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-dark-gray absolute left-3 top-1/2 transform -translate-y-1/2" />
                <Input
                  type="password"
                  placeholder="비밀번호"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`pl-9 h-10 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                />
              </div>
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                비밀번호 확인 <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-dark-gray absolute left-3 top-1/2 transform -translate-y-1/2" />
                <Input
                  type="password"
                  placeholder="비밀번호 확인"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`pl-9 h-10 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                />
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>

          {/* 본사 전용 필드 */}
          {userType === 'HQ' && (
            <>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  본사명 <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="본사명을 입력하세요"
                  value={formData.hqName}
                  onChange={(e) => handleInputChange('hqName', e.target.value)}
                  className={`h-10 ${errors.hqName ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.hqName && <p className="text-xs text-red-600 mt-1">{errors.hqName}</p>}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  사업자등록번호 <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="000-00-00000"
                  value={formData.businessNumber}
                  onChange={(e) => handleInputChange('businessNumber', e.target.value)}
                  className={`h-10 ${errors.businessNumber ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.businessNumber && <p className="text-xs text-red-600 mt-1">{errors.businessNumber}</p>}
              </div>
            </>
          )}

          {/* 가맹점 전용 필드 */}
          {userType === 'Store' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    매장명 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    placeholder="매장명"
                    value={formData.storeName}
                    onChange={(e) => handleInputChange('storeName', e.target.value)}
                    className={`h-10 ${errors.storeName ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.storeName && <p className="text-xs text-red-600 mt-1">{errors.storeName}</p>}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    점주명 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    placeholder="점주명"
                    value={formData.ownerName}
                    onChange={(e) => handleInputChange('ownerName', e.target.value)}
                    className={`h-10 ${errors.ownerName ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.ownerName && <p className="text-xs text-red-600 mt-1">{errors.ownerName}</p>}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  주소 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-dark-gray absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder="매장 주소를 입력하세요"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className={`pl-9 h-10 ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                  />
                </div>
                {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  지역 <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.region} onValueChange={(value: string) => handleInputChange('region', value)}>
                  <SelectTrigger className={`h-10 ${errors.region ? 'border-red-500' : 'border-gray-300'}`}>
                    <SelectValue placeholder="지역을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>``
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.region && <p className="text-xs text-red-600 mt-1">{errors.region}</p>}
              </div>
            </>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              className={`w-full h-11 rounded-lg font-medium ${
                userType === 'HQ'
                  ? 'bg-kpi-red hover:bg-red-600 text-white'
                  : 'bg-kpi-green hover:bg-green-600 text-white'
              }`}
            >
              {userType === 'HQ' ? '본사 계정 생성' : '가맹점 계정 생성'}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-dark-gray">
            계정 생성 시 
            <a href="#" className="text-kpi-red hover:underline ml-1">이용약관</a> 및 
            <a href="#" className="text-kpi-red hover:underline ml-1">개인정보처리방침</a>에 동의하게 됩니다.
          </p>
        </div>
      </Card>
    </div>
  );
}