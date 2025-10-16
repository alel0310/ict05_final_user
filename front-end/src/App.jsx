// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import JoinPage from "./pages/JoinPage";
import MainApp from "./pages/MainApp";

// 로그인 여부 체크 (localStorage에 accessToken 사용)
function RequireAuth({ children }) {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 기본 진입은 /login 으로 */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 공개 라우트 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/join" element={<JoinPage />} />

        {/* 보호(로그인 필요) 라우트 */}
        <Route
          path="/main"
          element={
            <RequireAuth>
              <MainApp />
            </RequireAuth>
          }
        />

        {/* 없는 경로는 로그인으로 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
