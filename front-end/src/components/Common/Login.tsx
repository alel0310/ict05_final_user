// src/components/Common/Login.tsx
import react, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Store, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import api from "../../lib/authApi";
import { requestFcmToken } from "../../lib/firebase"; // ⬅️ 추가

// JWT 파싱(스토어ID를 토큰에서 꺼낼 때 사용; 없으면 /me 호출)
function parseJwt(token: string): any | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async (e: any) => {
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
      // 1) 로그인
      const res = await api.post("/login", { email, password });
      const data = res?.data || {};

      // 토큰 저장(응답 형태에 맞춰 보강)
      const accessToken =
        data.accessToken ??
        res.headers?.authorization?.replace("Bearer ", "");
      const refreshToken = data.refreshToken;

      if (accessToken) {
        localStorage.setItem("accessToken", accessToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      }
      
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

      // 2) storeId 확보 (우선순위: 응답 -> /me -> JWT claims)
      let storeId: number | undefined =
        data.storeId ?? data.user?.storeId ?? data.store?.id;

      if (!storeId) {
        // (추천) 백엔드에 me 프로필이 있으면 여기서 가져오기
        try {
          const me = await api.get("/me", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          storeId = me.data?.storeId ?? me.data?.store?.id;
        } catch {
          /* /me 없음 */
        }
      }
      if (!storeId && accessToken) {
        const claims = parseJwt(accessToken);
        storeId =
          claims?.storeId ?? claims?.sid ?? claims?.storeID ?? undefined;
      }

      // 3) FCM 토큰 발급 → 서버 업서트 → 기본 토픽 구독
      try {
        const fcmToken = await requestFcmToken(); // 권한 요청 포함
        if (fcmToken && accessToken) {
          // 토큰 업서트
          await api.post(
            "/fcm/token",
            {
              token: fcmToken,
              platform: "WEB",
              deviceId: navigator.userAgent.slice(0, 120),
            },
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );

          // 기본 토픽: store-{storeId}
          if (storeId) {
            await api.post(
              `/fcm/topic/subscribe?token=${encodeURIComponent(
                fcmToken
              )}&topic=store-${storeId}`,
              {},
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
          }
        }
      } catch (fcme) {
        console.warn("[FCM] 등록/구독 실패(무시 가능):", fcme);
      }

      toast.success("로그인 성공");
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      console.error(err);
      const status = axios.isAxiosError(err) ? err?.response?.status : undefined;
      if (status === 401) setError("이메일 또는 비밀번호를 확인하세요.");
      else setError("로그인 중 오류가 발생했습니다.");
    } finally {
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
            <Button type="submit" className="w-full h-12 rounded-lg font-medium bg-kpi-red hover:bg-red-600 text-white">
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
          <p className="text-xs text-dark-gray">© 2024 FranFriend ERP. All rights reserved.</p>
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
