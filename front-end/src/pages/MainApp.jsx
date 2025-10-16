// src/pages/MainApp.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Common/Layout";
import { HQDashboard } from "../components/HQ/Dashboard";
import { StoreDashboard } from "../components/Store/Dashboard";
import { Toaster, toast } from "sonner";

export default function MainApp() {
  const navigate = useNavigate();

  // 기본은 HQ, 로그인 페이지에서 localStorage에 저장한 타입이 있으면 사용
  const [userType, setUserType] = useState("HQ");

  // 로그인 타입 복원
  useEffect(() => {
    const saved = localStorage.getItem("loginType");
    if (saved === "HQ" || saved === "Store") setUserType(saved);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    toast.success("로그아웃되었습니다.");
    navigate("/login", { replace: true });
  };

  // 토큰 가드
  useEffect(() => {
    if (!localStorage.getItem("accessToken")) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // 대시보드만 허용 (사이드에서 다른 메뉴 눌러도 무시)
  const handlePageChange = (page) => {
    if (page !== "dashboard") return;
  };

  const DashboardOnly = userType === "HQ" ? <HQDashboard /> : <StoreDashboard />;

  return (
    <>
      <Layout
        userType={userType}
        currentPage="dashboard"
        onPageChange={handlePageChange}
        onLogout={handleLogout}
      >
        {DashboardOnly}
      </Layout>
      <Toaster />
    </>
  );
}
