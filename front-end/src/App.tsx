// src/App.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";            // ✅ navigate 사용
import { Layout } from "./components/Common/Layout";
// import LoginPage from "./pages/LoginPage";
// import { Register } from "./components/Common/Register";

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
import { DailyClosing } from "./components/Store/DailyClosing/DailyClosingPage";
import { ChannelRevenue } from "./components/Store/DailyClosing/ChannelRevenue";
import { MyPage} from "./components/Common/MyPage";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import { ErrorBoundary } from "./components/Common/ErrorBoundary";
import { OrderProvider } from "./components/Common/OrderContext";
// src/App.tsx (상단 imports)
import { StaffSchedule } from "./components/Store/StaffSchedule"; // ⬅️ 추가
import api from "./lib/authApi";
 // ✅ 인터셉터/강제로그아웃 핸들러

export default function App() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [ready, setReady] = useState(false);

  useEffect(()=> {
    const access = localStorage.getItem("accessToken");
    if(!access){
      navigate("/login", {replace: true});
      return;
    }
    api.get("/me").then(()=>setReady(true)).catch(()=>{
 
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      navigate("/login", { replace: true });
    });
  }, [navigate]);
  if (!ready) return null; // <-- ready 전에 Dashboard가 useEffect 실행 못함
  const handleLogout =() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    toast.success("로그아웃되었습니다.");
    navigate("/login", {replace : true});
  }

  const handlePageChange = (page: string) => setCurrentPage(page);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return <StoreDashboard/>;
      case "menu": return <ErrorBoundary><StoreMenuManagement /></ErrorBoundary>;
      case "orders":
      case "order-pos": return (<OrderProvider><ErrorBoundary><OrderSystem /></ErrorBoundary></OrderProvider>);
      case "order-list": return (<OrderProvider><ErrorBoundary><OrderList /></ErrorBoundary></OrderProvider> )
      case "order-kitchen":return (<OrderProvider><ErrorBoundary><KitchenDisplay /></ErrorBoundary></OrderProvider>);
      case "daily-closing": return (<OrderProvider><ErrorBoundary><DailyClosing /></ErrorBoundary></OrderProvider> );
      case "inventory":
      case "inventory-status": return <ErrorBoundary><InventoryStatus /></ErrorBoundary>;
      case "inventory-orders": return <ErrorBoundary><InventoryOrders /></ErrorBoundary>;
      case "inventory-new-order": return <ErrorBoundary><InventoryNewOrder /></ErrorBoundary>;
      case "finance": return <ErrorBoundary><FinanceManagement /></ErrorBoundary>;
      case "daily-closing": return (<OrderProvider><ErrorBoundary><DailyClosing /></ErrorBoundary></OrderProvider>);
      case "channel-revenue": return (<OrderProvider><ErrorBoundary><ChannelRevenue /></ErrorBoundary></OrderProvider>);
      case "mypage": return <ErrorBoundary><MyPage /></ErrorBoundary>
      case "staff":
      case "staff-list": return <ErrorBoundary><StaffList /></ErrorBoundary>;
      case "staff-payroll": return <ErrorBoundary><StaffPayroll /></ErrorBoundary>;
      case "staff-reports": return <ErrorBoundary><StaffWorkReports /></ErrorBoundary>;
      // renderContent() 내부 switch
      case "staff-schedule": return <ErrorBoundary><StaffSchedule /></ErrorBoundary>;
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

return (
  <>
    <Layout
      userType="Store"
      currentPage={currentPage}
      onPageChange={handlePageChange}
      onLogout={handleLogout}
    >
      {renderPage()}
    </Layout>
    <Toaster />
  </>
);

}
