// src/App.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";            // ✅ navigate 사용
import { Layout } from "./components/Common/Layout";
import { Login } from "./components/Common/Login";
import { Register } from "./components/Common/Register";
import { StoreDashboard } from "./components/Store/Dashboard";
import { StoreMenuManagement } from "./components/Store/MenuManagement";
import { OrderSystem } from "./components/Store/OrderSystem";
import { OrderList } from "./components/Store/OrderList";
import { KitchenDisplay } from "./components/Store/KitchenDisplay";
import { InventoryStatus } from "./components/Store/InventoryStatus";
import { InventoryOrders } from "./components/Store/InventoryOrders";
import { InventoryNewOrder } from "./components/Store/InventoryNewOrder";
import { FinanceManagement } from "./components/Store/FinanceManagement";
import { StaffList } from "./components/Store/StaffList";
import { StaffPayroll } from "./components/Store/StaffPayroll";
import { StaffWorkReports } from "./components/Store/StaffWorkReports";
import { NoticeEducation } from "./components/Store/NoticeEducation";
import { StoreReports } from "./components/Store/Reports";
import { ReportsSales } from "./components/Store/ReportsSales";
import { ReportsOrders } from "./components/Store/ReportsOrders";
import { ReportsMaterials } from "./components/Store/ReportsMaterials";
import { ReportsMembers } from "./components/Store/ReportsMembers";
import { DailyClosing } from "./components/Store/DailyClosing";
import { ChannelRevenue } from "./components/Store/ChannelRevenue";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import { ErrorBoundary } from "./components/Common/ErrorBoundary";
import { OrderProvider } from "./components/Common/OrderContext";

import { tokenStorage } from "./lib/tokenStorage";
import api, { setForceLogoutHandler } from "./lib/authApi"; // ✅ 인터셉터/강제로그아웃 핸들러

export default function App() {
  // 가맹점 모드 고정
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");

  const navigate = useNavigate(); // ✅ JSX 패턴과 동일하게 사용

  // ✅ 재발급 실패 등 강제 로그아웃 핸들러(인터셉터에서 호출)
  useEffect(() => {
    setForceLogoutHandler(() => {
      setIsLoggedIn(false);
      tokenStorage.clear();
      toast.error("로그인이 만료되었습니다. 다시 로그인해 주세요.");
      navigate("/login", { replace: true });        // ✅ 로그인 화면으로 이동
    });
  }, [navigate]);

  // ✅ 토큰 가드 + 인터셉터 동작 확인 (JSX 패턴 그대로)
  //    - 초기 진입 시, accessToken 없으면 /login
  //    - accessToken이 있어도 유효성 확인(/user). 실패하면 /login
  useEffect(() => {
    const access = tokenStorage.getAccess(); // localStorage.getItem("accessToken")와 동일한 역할
    if (!access) {
      setIsLoggedIn(false);
      navigate("/login", { replace: true });
      return;
    }
    api.get("/user")
      .then(() => {
        setIsLoggedIn(true);
      })
      .catch(() => {
        setIsLoggedIn(false);
        navigate("/login", { replace: true });
      });
  }, [navigate]);

  // Login 컴포넌트가 토큰 저장 후 호출
  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentPage("dashboard");
    toast.success("로그인되었습니다.");
    navigate("/", { replace: true }); // 로그인 후 메인으로
  };

  const handleRegister = (_userData: any) => {
    setShowRegister(false);
    toast.success("회원가입 완료! 로그인해 주세요.");
  };

  const handleLogout = () => {
    tokenStorage.clear();
    setIsLoggedIn(false);
    setCurrentPage("dashboard");
    toast.success("로그아웃되었습니다.");
    navigate("/login", { replace: true });
  };

  const handlePageChange = (page: string) => setCurrentPage(page);

  const renderContent = () => {
    if (currentPage === "dashboard") {
      return (
        <ErrorBoundary>
          <StoreDashboard />
        </ErrorBoundary>
      );
    }
    switch (currentPage) {
      case "menu": return <ErrorBoundary><StoreMenuManagement /></ErrorBoundary>;
      case "orders":
      case "order-pos": return <ErrorBoundary><OrderSystem /></ErrorBoundary>;
      case "order-list": return <ErrorBoundary><OrderList /></ErrorBoundary>;
      case "order-kitchen": return <ErrorBoundary><KitchenDisplay /></ErrorBoundary>;
      case "inventory":
      case "inventory-status": return <ErrorBoundary><InventoryStatus /></ErrorBoundary>;
      case "inventory-orders": return <ErrorBoundary><InventoryOrders /></ErrorBoundary>;
      case "inventory-new-order": return <ErrorBoundary><InventoryNewOrder /></ErrorBoundary>;
      case "finance": return <ErrorBoundary><FinanceManagement /></ErrorBoundary>;
      case "daily-closing": return <ErrorBoundary><DailyClosing /></ErrorBoundary>;
      case "channel-revenue": return <ErrorBoundary><ChannelRevenue /></ErrorBoundary>;
      case "staff":
      case "staff-list": return <ErrorBoundary><StaffList /></ErrorBoundary>;
      case "staff-payroll": return <ErrorBoundary><StaffPayroll /></ErrorBoundary>;
      case "staff-reports": return <ErrorBoundary><StaffWorkReports /></ErrorBoundary>;
      case "notice": return <ErrorBoundary><NoticeEducation /></ErrorBoundary>;
      case "reports": return <ErrorBoundary><StoreReports /></ErrorBoundary>;
      case "reports-sales": return <ErrorBoundary><ReportsSales /></ErrorBoundary>;
      case "reports-orders": return <ErrorBoundary><ReportsOrders /></ErrorBoundary>;
      case "reports-materials": return <ErrorBoundary><ReportsMaterials /></ErrorBoundary>;
      case "reports-members": return <ErrorBoundary><ReportsMembers /></ErrorBoundary>;
      default:
        return (
          <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{currentPage} 페이지</h2>
              <p className="text-dark-gray">가맹점 {currentPage} 기능이 곧 추가됩니다.</p>
            </div>
          </div>
        );
    }
  };

  // 로그인 전: 무조건 로그인/회원가입
  if (!isLoggedIn) {
    if (showRegister) {
      return (
        <>
          <Register onRegister={handleRegister} onBackToLogin={() => setShowRegister(false)} />
          <Toaster />
        </>
      );
    }
    return (
      <>
        <Login onLogin={handleLogin} onRegister={() => setShowRegister(true)} />
        <Toaster />
      </>
    );
  }

  // 로그인 후
  return (
    <OrderProvider>
      <Layout
        userType={"Store"}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onLogout={handleLogout}
      >
        {renderContent()}
      </Layout>
      <Toaster />
    </OrderProvider>
  );
}
