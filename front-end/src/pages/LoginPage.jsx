import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LoginPage.css";
import api from "../lib/authApi"; // axios 인스턴스 (인터셉터 포함)

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
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
      const res = await api.post("/login", { email, password });

      // 서버가 본문으로 토큰을 내려줄 수도/안 줄 수도 있으므로 안전 처리
      const data = res?.data || {};
      if (data.accessToken) localStorage.setItem("accessToken", data.accessToken);
      if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);

      // 라우팅
      navigate("/main", { replace: true });
    } catch (err) {
      console.error(err);
      const status = err?.response?.status;
      if (status === 401) setError("이메일 또는 비밀번호를 확인하세요.");
      else setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        {/* 로고/타이틀 */}
        <div className="login-logo">🏪</div>
        <h1 className="login-title">FranFriend ERP</h1>
        <p className="login-subtitle">프랜차이즈 통합 관리 시스템</p>

        {/* 폼 */}
        <form onSubmit={handleLogin} style={{ marginTop: 8 }}>
          <label className="login-label">이메일</label>
          <input
            className="login-input"
            type="email"
            placeholder="이메일을 입력하세요"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />

          <label className="login-label">비밀번호</label>
          <input
            className="login-input"
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-btn-primary" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/join")}
            className="login-btn-secondary"
          >
            회원가입
          </button>
        </form>

        {/* 데모 계정 (HQ 문구 제거) */}
        <div className="login-demo">
          <p className="title">데모 계정</p>
          <p>가맹점: store@franfriend.com / demo123</p>
        </div>

        <footer className="login-footer">
          © 2024 FranFriend ERP. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
