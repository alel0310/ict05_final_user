import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner'; // react-hot-toast 등 교체 가능
import {
  Package,
  TrendingUp,
  DollarSign,
  ChefHat,
  AlertTriangle,
  Clock,
  Power,
  Eye,
} from 'lucide-react';

import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { FormModal } from '../Common/FormModal';
import { useConfirmDialog } from '../Common/ConfirmDialog';

// ======================
// 타입 정의
// ======================

type SoldOutStatus = 'ON_SALE' | 'SOLD_OUT';
type MenuShow = 'SHOW' | 'HIDE';

export type StoreMenu = {
  menuId: number;
  menuName: string;
  menuNameEnglish: string;
  menuCategoryId: number;
  menuCategoryName: string;
  menuPrice: number;
  menuKcal: number;
  menuInformation: string;
  menuCode: string;
  ingredients: string;
  soldOutStatus: SoldOutStatus;
  menuShow: MenuShow;
};

type PageResponse<T> = {
  content: T[];
};

// ======================
// 헬퍼 함수
// ======================

const getCategoryEmoji = (categoryName: string): string => {
  if (categoryName.includes('세트')) return '🍔';
  if (categoryName.includes('토스트')) return '🍞';
  if (categoryName.includes('사이드')) return '🍟';
  if (categoryName.includes('음료')) return '🥤';
  return '🍽️';
};

// ======================
// 컴포넌트
// ======================

export const StoreMenuManagement: React.FC = () => {
  const [menus, setMenus] = useState<StoreMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<StoreMenu | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { dialog, confirm } = useConfirmDialog();

  //  백엔드 데이터 호출
  useEffect(() => {
    axios
      .get<PageResponse<StoreMenu>>('/API/menu/list', {
        params: { page: 0, size: 10 },
      })
      .then((res) => setMenus(res.data.content))
      .catch((err) => {
        console.error(err);
        toast.error('메뉴 목록을 불러오지 못했습니다.');
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    { label: '전체', value: 'all', count: menus.length },
    {
      label: '세트',
      value: '세트',
      count: menus.filter((m) => m.menuCategoryName.includes('세트')).length,
    },
    {
      label: '토스트',
      value: '토스트',
      count: menus.filter((m) => m.menuCategoryName.includes('토스트')).length,
    },
    {
      label: '사이드',
      value: '사이드',
      count: menus.filter((m) => m.menuCategoryName.includes('사이드')).length,
    },
    {
      label: '음료',
      value: '음료',
      count: menus.filter((m) => m.menuCategoryName.includes('음료')).length,
    },
    {
      label: '판매중',
      value: 'available',
      count: menus.filter((m) => m.soldOutStatus === 'ON_SALE').length,
    },
    {
      label: '품절',
      value: 'soldout',
      count: menus.filter((m) => m.soldOutStatus === 'SOLD_OUT').length,
    },
  ];

  // 필터링된 메뉴
  const filteredMenus = menus.filter((menu) => {
    const matchesSearch =
      searchTerm === '' ||
      menu.menuName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      menu.menuCategoryName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' ||
      menu.menuCategoryName.includes(selectedCategory) ||
      (selectedCategory === 'available' && menu.soldOutStatus === 'ON_SALE') ||
      (selectedCategory === 'soldout' && menu.soldOutStatus === 'SOLD_OUT');

    return matchesSearch && matchesCategory;
  });

  // 판매 상태 토글
  const handleToggleStatus = (menuId: number, isOnSale: boolean) => {
    setMenus((prev) =>
      prev.map((menu) =>
        menu.menuId === menuId
          ? { ...menu, soldOutStatus: isOnSale ? 'ON_SALE' : 'SOLD_OUT' }
          : menu,
      ),
    );
    const target = menus.find((m) => m.menuId === menuId);
    if (target)
      toast.success(
        `${target.menuName}을(를) ${
          isOnSale ? '판매중으로 변경했습니다.' : '품절 처리했습니다.'
        }`,
      );
  };

  const handleSoldOut = (menu: StoreMenu) => {
    confirm({
      title: '품절 처리',
      description: `${menu.menuName}을(를) 품절 처리하시겠습니까?`,
      type: 'warning',
      confirmText: '품절 처리',
      onConfirm: () => {
        setMenus((prev) =>
          prev.map((m) =>
            m.menuId === menu.menuId ? { ...m, soldOutStatus: 'SOLD_OUT' } : m,
          ),
        );
        toast.success(`${menu.menuName}을(를) 품절 처리했습니다.`);
      },
    });
  };

  const handleRestock = (menu: StoreMenu) => {
    setMenus((prev) =>
      prev.map((m) =>
        m.menuId === menu.menuId
          ? { ...m, soldOutStatus: 'ON_SALE' }
          : m,
      ),
    );
    toast.success(`${menu.menuName} 재입고 완료되었습니다.`);
  };

  const handleMenuDetail = (menu: StoreMenu) => {
    setSelectedMenu(menu);
    setIsDetailModalOpen(true);
  };

  // 메뉴 추가 폼 필드 (단순 구조)
  const formFields = [
    {
      name: 'category',
      label: '카테고리 *',
      type: 'select' as const,
      required: true,
      options: [
        { value: '세트', label: '세트메뉴' },
        { value: '토스트', label: '토스트' },
        { value: '사이드', label: '사이드' },
        { value: '음료', label: '음료' },
      ],
    },
    {
      name: 'name',
      label: '메뉴명 *',
      type: 'text' as const,
      required: true,
    },
    {
      name: 'nameEnglish',
      label: '영문명 *',
      type: 'text' as const,
      required: true,
    },
    {
      name: 'price',
      label: '가격(원) *',
      type: 'number' as const,
      required: true,
    },
    {
      name: 'kcal',
      label: '칼로리(kcal)',
      type: 'number' as const,
      required: false,
    },
    {
      name: 'description',
      label: '설명 *',
      type: 'textarea' as const,
      required: true,
    },
    {
      name: 'menuCode',
      label: '상품코드 *',
      type: 'text' as const,
      required: true,
    },
  ];

  const handleSubmit = async (data: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      const newId = menus.length ? Math.max(...menus.map((m) => m.menuId)) + 1 : 1;
      const newMenu: StoreMenu = {
        menuId: newId,
        menuName: data.name,
        menuNameEnglish: data.nameEnglish,
        menuCategoryId: 0,
        menuCategoryName: data.category,
        menuPrice: Number(data.price),
        menuKcal: Number(data.kcal) || 0,
        menuInformation: data.description,
        menuCode: data.menuCode,
        ingredients: '',
        soldOutStatus: 'ON_SALE',
        menuShow: 'SHOW',
      };
      setMenus((prev) => [...prev, newMenu]);
      toast.success('새 메뉴가 추가되었습니다.');
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ======================
  // JSX 렌더링
  // ======================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>메뉴 관리</h1>
          <p className="text-dark-gray">
            {loading ? '불러오는 중...' : `총 ${menus.length}개 항목`}
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-kpi-red hover:bg-red-600 text-white"
        >
          + 메뉴 추가
        </Button>
      </div>

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="relative max-w-md">
            <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="메뉴명, 키워드로 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-kpi-red focus:border-transparent"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.value
                    ? 'bg-kpi-red text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category.label} ({category.count})
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Menu Table */}
      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-10 text-gray-500">불러오는 중...</div>
          ) : filteredMenus.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">조건에 맞는 메뉴가 없습니다.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                    메뉴정보
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                    가격
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                    판매상태
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMenus.map((menu) => (
                  <tr key={menu.menuId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-lg">
                          {getCategoryEmoji(menu.menuCategoryName)}
                        </div>
                        <div>
                          <div
                            className="font-medium text-gray-900 cursor-pointer hover:text-kpi-orange"
                            onClick={() => handleMenuDetail(menu)}
                          >
                            {menu.menuName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {menu.menuCategoryName}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      ₩{menu.menuPrice.toLocaleString()}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={menu.soldOutStatus === 'ON_SALE'}
                          onCheckedChange={(checked) =>
                            handleToggleStatus(menu.menuId, checked)
                          }
                        />
                        <span
                          className={`text-sm ${
                            menu.soldOutStatus === 'SOLD_OUT'
                              ? 'text-gray-400'
                              : 'text-green-600'
                          }`}
                        >
                          {menu.soldOutStatus === 'SOLD_OUT'
                            ? '품절'
                            : '판매중'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="메뉴 추가"
        fields={formFields}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />

      {/* Menu Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          {selectedMenu && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedMenu.menuName}</DialogTitle>
                <DialogDescription>
                  {selectedMenu.menuNameEnglish}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="p-4">
                <p className="text-gray-700 mb-3">
                  {selectedMenu.menuInformation}
                </p>
                <p className="text-sm text-gray-500">
                  상품코드: {selectedMenu.menuCode}
                </p>
                <p className="text-sm text-gray-500">
                  카테고리: {selectedMenu.menuCategoryName}
                </p>
                <p className="text-sm text-gray-500">
                  칼로리: {selectedMenu.menuKcal}kcal
                </p>
                <p className="text-sm text-gray-500">
                  가격: ₩{selectedMenu.menuPrice.toLocaleString()}
                </p>
                <div className="mt-4 flex gap-2">
                  {selectedMenu.soldOutStatus === 'SOLD_OUT' ? (
                    <Button
                      onClick={() => handleRestock(selectedMenu)}
                      className="bg-kpi-green text-white"
                    >
                      재입고
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSoldOut(selectedMenu)}
                      variant="outline"
                      className="text-kpi-orange border-kpi-orange"
                    >
                      품절 처리
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailModalOpen(false)}
                  >
                    닫기
                  </Button>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>

      {dialog}
    </div>
  );
};
