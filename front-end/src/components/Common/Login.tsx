import  react, {useState} from "react";
import {useNavigate} from "react-router-dom";
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Store, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';
import axios from "axios";
import api from "../../lib/authApi";


export default function Login(){
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState<boolean>(false);

    const handleLogin = async (e : any) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        setError("");

        if (!email || !password) {
            setError("이메일과 비밀번호를 입력하세요.");
            setLoading(false);
            return;
        }

        try {
            // axios 인스턴스로 로그인 (withCredentials 등 공통설정 사용)
            const res = await api.post("/login", {email, password});

            // 서버가 본문으로 토큰을 내려줄 수도/안 줄 수도 있으므로 안전 처리
            const data = res?.data || {};
            if (data.accessToken) localStorage.setItem("accessToken", data.accessToken);
            if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);

            // const { accessToken, refreshToken } = res.data;
            // localStorage.setTokens({ accessToken, refreshToken });
            // 라우팅
            navigate("/dashboard", {replace:true});
        }  catch(err: unknown){
            console.error(err);
            const status = axios.isAxiosError(err) ? err?.response?.status : undefined; 
            if (status === 401) setError("이메일 또는 비밀번호를 확인하세요.");
            else setError("로그인 중 오류가 발생했습니다.");
        }  finally{
            setLoading(false);
        }
    };
    return (
    <div className="min-h-screen bg-light-gray flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-kpi-orange rounded-xl flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">FranFriend ERP</h1>
          <p className="text-dark-gray">프랜차이즈 통합 관리 시스템</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
              이메일
            </Label>
            <div className="relative">
              <Mail className="w-5 h-5 text-dark-gray absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                id="email"
                type="email"
                placeholder="이메일을 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-medium text-gray-700 mb-2 block">
              비밀번호
            </Label>
            <div className="relative">
              <Lock className="w-5 h-5 text-dark-gray absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-12 border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              type="submit"
              className="w-full h-12 rounded-lg font-medium bg-kpi-red hover:bg-red-600 text-white"
            >
              로그인
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/register")}
              className="w-full h-12 rounded-lg font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              회원가입
            </Button>
          </div>
        </form>

        {/* Demo Accounts Info (가맹점만) */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">데모 계정</h4>
          <div className="text-xs text-blue-800 space-y-1">
            <p>
              <strong>가맹점:</strong> store@franfriend.com / demo123
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-dark-gray">
            © 2024 FranFriend ERP. All rights reserved.
          </p>
          <div className="flex justify-center gap-4 mt-2">
            <a href="#" className="text-xs text-dark-gray hover:text-gray-900">이용약관</a>
            <a href="#" className="text-xs text-dark-gray hover:text-gray-900">개인정보처리방침</a>
            <a href="#" className="text-xs text-dark-gray hover:text-gray-900">고객지원</a>
          </div>
        </div>
      </Card>
    </div>
  );
}
