// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import App from "./App";
import Login from "./components/Common/Login";
import { Register } from "./components/Common/Register";
import api from "./lib/authApi";
import { toast } from "sonner";
import "./index.css";

// Register용 래퍼: props 채워서 내려보내기
function RegisterPage() {
  const navigate = useNavigate();

  const handleRegister = async (userData: any) => {
    try {
      // 백엔드 회원가입: baseURL = http://localhost:8082/user
      // → 최종 요청 URL = http://localhost:8082/user/join
      await api.post("/join", {
        email: userData.email,
        password: userData.password,
        name: userData.name,
        phone: userData.phone,
      });
      toast.success("회원가입이 완료되었습니다. 로그인해 주세요.");
      navigate("/login", { replace: true });
    } catch (e) {
      console.error(e);
      toast.error("회원가입 중 오류가 발생했습니다.");
    }
  };

  return (
    <Register
      onRegister={handleRegister}
      onBackToLogin={() => navigate("/login", { replace: true })}
    />
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard/*" element={<App />} />
        <Route path="/" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
