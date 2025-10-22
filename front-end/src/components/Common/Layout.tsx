import React, { useState } from 'react';
import { 
  Building2, 
  Store, 
  Menu, 
  Settings, 
  LogOut, 
  ChevronDown,
  ChevronRight,
  Home,
  Users,
  Package,
  Truck,
  MessageSquare,
  BarChart3,
  ShoppingCart,
  Calculator,
  UserCheck,
  BookOpen,
  Calendar
} from 'lucide-react';
import { Button } from '../ui/button';

interface LayoutProps {
  children: React.ReactNode;
  userType: 'HQ' | 'Store';
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  children?: MenuItem[];
}

const hqMenuItems: MenuItem[] = [
  { id: 'dashboard', label: '대시보드', icon: Home },
  { id: 'stores', label: '가맹점 관리', icon: Building2 },
  { id: 'menu', label: '메뉴 관리', icon: Package },
  { id: 'inventory', label: '재고 관리', icon: Package },
  { id: 'staff', label: '직원 관리', icon: Users },
  { id: 'logistics', label: '물류/발주', icon: Truck },
  { id: 'notice', label: '공지사항', icon: MessageSquare },
  { id: 'reports', label: '리포트', icon: BarChart3 },
];

const storeMenuItems: MenuItem[] = [
  { id: 'dashboard', label: '대시보드', icon: Home },
  { id: 'menu', label: '메뉴 관리', icon: Package },
  { 
    id: 'orders', 
    label: '주문/결제', 
    icon: ShoppingCart,
    children: [
      { id: 'order-pos', label: '주문등록', icon: ShoppingCart },
      { id: 'order-list', label: '주문리스트', icon: Package },
      { id: 'order-kitchen', label: '주방화면', icon: Settings }
    ]
  },
  { 
    id: 'inventory', 
    label: '재고/발주', 
    icon: Package,
    children: [
      { id: 'inventory-status', label: '재고 현황', icon: Package },
      { id: 'inventory-orders', label: '발주 관리', icon: Truck },
      { id: 'inventory-new-order', label: '발주 등록', icon: ShoppingCart }
    ]
  },
  { 
    id: 'finance', 
    label: '정산', 
    icon: Calculator,
    children: [
      { id: 'daily-closing', label: '일일 마감/시재', icon: Calculator },
      { id: 'channel-revenue', label: '서비스 채널', icon: BarChart3 }
    ]
  },
  { 
    id: 'staff', 
    label: '직원 관리', 
    icon: UserCheck,
    children: [
      { id: 'staff-list', label: '직원 목록', icon: Users },
      { id: 'staff-schedule', label: '근무 일정', icon: Calendar },
      { id: 'staff-payroll', label: '급여 관리', icon: Calculator },
      { id: 'staff-reports', label: '근무리포트', icon: BarChart3 }
    ]
  },
  { id: 'notice', label: '공지/교육', icon: BookOpen },
  { 
    id: 'reports', 
    label: '리포트', 
    icon: BarChart3,
    children: [
      { id: 'reports-sales', label: '매출 분석', icon: BarChart3 },
      { id: 'reports-orders', label: '주문 분석', icon: ShoppingCart },
      { id: 'reports-materials', label: '원재료 분석', icon: Package },
      { id: 'reports-members', label: '회원 분석', icon: Users }
    ]
  },
];

export function Layout({ children, userType, currentPage, onPageChange, onLogout }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
    // 초기 로드 시 현재 페이지가 서브메뉴에 속하면 해당 메뉴를 자동으로 확장
    const menuItems = userType === 'HQ' ? hqMenuItems : storeMenuItems;
    const autoExpand: string[] = [];
    
    menuItems.forEach(item => {
      if (item.children && item.children.some(child => child.id === currentPage)) {
        autoExpand.push(item.id);
      }
    });
    
    return autoExpand;
  });
  
  const menuItems = userType === 'HQ' ? hqMenuItems : storeMenuItems;

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  return (
    <div className="min-h-screen bg-light-gray flex">
      {/* Sidebar */}
      <div className={`bg-navy-sidebar text-white transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Logo & Header */}
        <div className="p-4 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-kpi-orange rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="font-bold">FranFriend ERP</h1>
                <p className="text-sm text-white/70">{userType === 'HQ' ? '본사' : '가맹점'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id || (item.children && item.children.some(child => child.id === currentPage));
            const isExpanded = expandedMenus.includes(item.id);
            
            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (item.children) {
                      toggleMenu(item.id);
                    } else {
                      onPageChange(item.id);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.children && (
                        isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                      )}
                    </>
                  )}
                </button>
                
                {item.children && isExpanded && !sidebarCollapsed && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const isChildActive = currentPage === child.id;
                      return (
                        <button
                          key={child.id}
                          onClick={() => onPageChange(child.id)}
                          className={`w-full flex items-center gap-2 px-2 py-1 rounded text-sm transition-colors ${
                            isChildActive 
                              ? 'bg-white/20 text-white' 
                              : 'text-white/70 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <ChildIcon className="w-4 h-4" />
                          {child.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          {!sidebarCollapsed && (
            <>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
              >
                <Settings className="w-4 h-4 mr-2" />
                설정
              </Button>
              <Button 
                variant="ghost" 
                onClick={onLogout}
                className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {(() => {
                    // 먼저 최상위 메뉴에서 찾기
                    const topLevelMenu = menuItems.find(item => item.id === currentPage);
                    if (topLevelMenu) return topLevelMenu.label;
                    
                    // 서브메뉴에서 찾기
                    for (const item of menuItems) {
                      if (item.children) {
                        const subMenu = item.children.find(child => child.id === currentPage);
                        if (subMenu) return subMenu.label;
                      }
                    }
                    
                    return '대시보드';
                  })()}
                </h2>
                <p className="text-sm text-dark-gray">
                  {userType === 'HQ' ? '본사 관리 시스템' : '가맹점 관리 시스템'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">관리자</p>
                <p className="text-xs text-dark-gray">
                  {userType === 'HQ' ? '본사' : '강남점'}
                </p>
              </div>
              <div className="w-8 h-8 bg-kpi-green rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}