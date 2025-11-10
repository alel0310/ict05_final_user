import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Package } from 'lucide-react';

import { Card } from '../ui/card';
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
// 공통 axios 인스턴스 (JWT 자동 첨부)
// ======================

const api = axios.create({
  baseURL: 'http://localhost:8082',
});

api.interceptors.request.use((config) => {
  // 로그인 후 localStorage 에 저장해 둔 토큰 키 이름으로 바꿔줘도 됨
  const token = localStorage.getItem('accessToken');

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

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
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
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
  // 전체 메뉴 목록 (모든 페이지)
  const [menus, setMenus] = useState<StoreMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<StoreMenu | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { dialog, confirm } = useConfirmDialog();

  // 클라이언트 페이징 상태
  const [page, setPage] = useState(0); // 0-based
  const pageSize = 10;

  // ======================
  // 메뉴 목록 조회 함수 (재사용)
  // ======================
  const fetchMenus = async () => {
    setLoading(true);
    try {
      const res = await api.get<PageResponse<StoreMenu>>(
        '/user/API/menu/list',
        {
          params: { page: 0, size: 1000 },
        },
      );

      console.log('menu list response:', res.data);
      const rawMenus = res.data.content ?? [];

      // soldOutStatus 없으면 기본값 ON_SALE
      const normalized: StoreMenu[] = rawMenus.map((m) => ({
        ...m,
        soldOutStatus: (m.soldOutStatus ?? 'ON_SALE') as SoldOutStatus,
      }));

      setMenus(normalized);
    } catch (err) {
      console.error(err);
      toast.error('메뉴 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 초기 로딩
  useEffect(() => {
    fetchMenus();
  }, []);

  // 검색어 / 카테고리 바뀌면 첫 페이지로 리셋
  useEffect(() => {
    setPage(0);
  }, [searchTerm, selectedCategory]);

  // ======================
  // 필터 + 페이징 계산
  // ======================

  // 전체 개수 (상단 "총 N개 항목")
  const totalElements = menus.length;

  // 검색/카테고리로 필터링 (전체 목록 기준)
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

  // 전체 페이지 수 / 현재 페이지 데이터
  const totalPages =
    filteredMenus.length === 0 ? 1 : Math.ceil(filteredMenus.length / pageSize);

  const currentPage = Math.min(page, totalPages - 1);
  const pageStart = currentPage * pageSize;
  const pageEnd = pageStart + pageSize;
  const pageMenus = filteredMenus.slice(pageStart, pageEnd);

  // 카테고리/판매상태 카운트는 "전체 메뉴" 기준으로
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

  // ======================
  // 공통: 서버에 품절 상태 업데이트
  // ======================

  const updateSoldOutOnServer = async (
    menuId: number,
    status: SoldOutStatus,
  ) => {
    await api.patch(`/user/API/menu/${menuId}/sold-out`, {
      soldOutStatus: status,
    });
  };

  // ======================
  // 이벤트 핸들러
  // ======================

  // 판매 상태 토글 (Switch)
  const handleToggleStatus = async (menuId: number, isOnSale: boolean) => {
    const newStatus: SoldOutStatus = isOnSale ? 'ON_SALE' : 'SOLD_OUT';

    try {
      await updateSoldOutOnServer(menuId, newStatus);

      setMenus((prev) =>
        prev.map((menu) =>
          menu.menuId === menuId
            ? { ...menu, soldOutStatus: newStatus }
            : menu,
        ),
      );

      const target = menus.find((m) => m.menuId === menuId);
      if (target) {
        toast.success(
          `${target.menuName}을(를) ${
            newStatus === 'ON_SALE' ? '판매중으로 변경했습니다.' : '품절 처리했습니다.'
          }`,
        );
      }
    } catch (e) {
      console.error(e);
      toast.error('판매 상태 변경에 실패했습니다.');
    }
  };

  const handleSoldOut = (menu: StoreMenu) => {
    confirm({
      title: '품절 처리',
      description: `${menu.menuName}을(를) 품절 처리하시겠습니까?`,
      type: 'warning',
      confirmText: '품절 처리',
      onConfirm: async () => {
        try {
          await updateSoldOutOnServer(menu.menuId, 'SOLD_OUT');

          setMenus((prev) =>
            prev.map((m) =>
              m.menuId === menu.menuId
                ? { ...m, soldOutStatus: 'SOLD_OUT' }
                : m,
            ),
          );
          toast.success(`${menu.menuName}을(를) 품절 처리했습니다.`);
        } catch (e) {
          console.error(e);
          toast.error('품절 처리에 실패했습니다.');
        }
      },
    });
  };

  const handleRestock = async (menu: StoreMenu) => {
    try {
      await updateSoldOutOnServer(menu.menuId, 'ON_SALE');

      setMenus((prev) =>
        prev.map((m) =>
          m.menuId === menu.menuId ? { ...m, soldOutStatus: 'ON_SALE' } : m,
        ),
      );
      toast.success(`${menu.menuName} 재입고 완료되었습니다.`);
    } catch (e) {
      console.error(e);
      toast.error('재입고 처리에 실패했습니다.');
    }
  };

  // 상세 모달 열기 (재료 포함)
  const handleMenuDetail = async (menu: StoreMenu) => {
    try {
      const res = await api.get<StoreMenu>(`/user/API/menu/${menu.menuId}`);

      const detail: StoreMenu = {
        ...menu,
        ...res.data,
        soldOutStatus: (res.data.soldOutStatus ?? 'ON_SALE') as SoldOutStatus,
      };

      setSelectedMenu(detail);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error('메뉴 상세 정보를 불러오지 못했습니다.');
    }
  };

  // ======================
  // 메뉴 추가 폼 필드 (재료 입력 추가)
  // ======================

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
      name: 'ingredients',
      label: '재료 정보',
      type: 'textarea' as const,
      required: false,
      placeholder: '예) 마가린, 딥치즈소스...',
    },
    {
      name: 'menuCode',
      label: '상품코드 *',
      type: 'text' as const,
      required: true,
    },
  ];

  // ======================
  // 메뉴 추가 (DB 저장 + 목록 재조회)
  // ======================

  const handleSubmit = async (data: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      await api.post('/user/API/menu', {
        menuName: data.name,
        menuNameEnglish: data.nameEnglish,
        menuCategoryName: data.category, // 백엔드 DTO 에 맞게 조정
        menuPrice: Number(data.price),
        menuKcal: Number(data.kcal) || 0,
        menuInformation: data.description,
        menuCode: data.menuCode,
        ingredients: data.ingredients ?? '',
        soldOutStatus: 'ON_SALE',
        menuShow: 'SHOW',
      });

      await fetchMenus();

      toast.success('새 메뉴가 추가되었습니다.');
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('메뉴 저장 중 오류가 발생했습니다.');
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
            {loading ? '불러오는 중...' : `총 ${totalElements}개 항목`}
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
          ) : pageMenus.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">조건에 맞는 메뉴가 없습니다.</p>
            </div>
          ) : (
            <>
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
                  {pageMenus.map((menu) => (
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

              {/* 페이징 바 - 숫자 버튼 버전 */}
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <span className="text-sm text-gray-500">
                  {`${currentPage + 1} / ${totalPages} 페이지`}
                </span>
                <div className="flex items-center gap-2">
                  {/* 이전 버튼 */}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 0}
                    onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                  >
                    이전
                  </Button>

                  {/* 숫자 페이지 버튼들 */}
                  {Array.from({ length: totalPages }, (_, idx) => idx).map(
                    (idx) => (
                      <Button
                        key={idx}
                        size="sm"
                        variant={idx === currentPage ? 'default' : 'outline'}
                        onClick={() => setPage(idx)}
                      >
                        {idx + 1}
                      </Button>
                    ),
                  )}

                  {/* 다음 버튼 */}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() =>
                      setPage((prev) => Math.min(prev + 1, totalPages - 1))
                    }
                  >
                    다음
                  </Button>
                </div>
              </div>
            </>
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
                <p className="text-sm text-gray-500 mb-4">
                  가격: ₩{selectedMenu.menuPrice.toLocaleString()}
                </p>

                {/* 재료 정보 섹션 */}
                <div className="mt-4 border rounded-xl p-4 bg-gray-50">
                  <h3 className="text-sm font-semibold mb-2">재료 정보</h3>
                  <p className="text-sm text-gray-700">
                    {selectedMenu.ingredients &&
                    selectedMenu.ingredients.trim().length > 0
                      ? selectedMenu.ingredients
                      : '등록된 재료 정보가 없습니다.'}
                  </p>
                </div>

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
