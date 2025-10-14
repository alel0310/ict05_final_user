import { useState } from "react";
import { useNavigate } from "react-router-dom";

// .env 에서 BASE 읽기 (예: http://localhost:8081 또는 /admin 포함)
const BASE = process.env.REACT_APP_BACKEND_API_BASE_URL;

function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("아이디와 비밀번호를 입력하세요.");
      return;
    }
    if (!BASE) {
      setError("백엔드 BASE URL이 설정되지 않았습니다.");
      return;
    }

    try {
      const res = await fetch(`${BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 서버가 쿠키로 토큰을 줄 때 필요
        body: JSON.stringify({ username, password }),
      });

      // 본문이 비어 있을 수도 있어 대비
      const raw = await res.text();
      if (!res.ok) {
        setError(`로그인 실패 (${res.status})`);
        return;
      }

      // 서버가 JSON을 주면 토큰 저장 (쿠키만 주는 서버면 이 단계는 건너뜀)
      try {
        if (raw) {
          const data = JSON.parse(raw);
          if (data.accessToken) localStorage.setItem("accessToken", data.accessToken);
          if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
        }
      } catch {
        // JSON이 아니면 무시 (쿠키 기반 로그인 성공 케이스)
      }

      // 성공 시 사용자 페이지로 이동
      navigate("/user"); // 라우트가 /mypage 등이라면 여기를 맞춰주세요
    } catch (err) {
      console.error(err);
      setError("네트워크 오류로 로그인에 실패했습니다.");
    }
  };

  return (
    <div>
      <h1>로그인</h1>

      <form onSubmit={handleLogin}>
        <label>아이디</label>
        <input
          type="text"
          placeholder="아이디"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
        />

        <label>비밀번호</label>
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        {error && <p>{error}</p>}

        <button type="submit">계속</button>
      </form>
    </div>
  );
}

export default LoginPage;
