import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

// .env 에서 BASE 읽기 (예: http://localhost:8081 또는 /admin 포함)
const BASE = process.env.REACT_APP_BACKEND_API_BASE_URL;

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;           // 중복 제출 방지
    setLoading(true);
    setError("");

    if (!email || !password) {
      setError("이메일과 비밀번호를 입력하세요.");
      setLoading(false);
      return;
    }
    if (!BASE) {
      setError("백엔드 BASE URL이 설정되지 않았습니다.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        // ⬇️ loginType 제거: 항상 일반 로그인
        body: JSON.stringify({ email, password }),
      });

      const raw = await res.text(); // 본문이 비어있을 수도 있음
      if (!res.ok) {
        setError(`로그인 실패 (${res.status})`);
        return;
      }

      // 서버가 토큰을 본문으로 주는 경우만 저장 (쿠키 기반이면 스킵)
      try {
        if (raw) {
          const data = JSON.parse(raw);
          if (data.accessToken) localStorage.setItem("accessToken", data.accessToken);
          if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
        }
      } catch {
        /* JSON 아님 → 무시 */
      }

      navigate("/main");
    } catch (err) {
      console.error(err);
      setError("네트워크 오류로 로그인에 실패했습니다.");
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

        {/* 데모 계정 */}
        <div className="login-demo">
          <p className="title">데모 계정</p>
          <p>본사: hq@franfriend.com / demo123</p>
          <p>가맹점: store@franfriend.com / demo123</p>
        </div>

        <footer className="login-footer">
          © 2024 FranFriend ERP. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
