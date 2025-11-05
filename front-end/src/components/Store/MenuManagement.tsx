import React, { useState } from 'react';
import { FormModal } from '../Common/FormModal';
import { ConfirmDialog, useConfirmDialog } from '../Common/ConfirmDialog';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import {
  Package,
  ChefHat,
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  Eye,
  Power
} from 'lucide-react';
import { toast } from 'sonner';

// ======================
// 타입 / 샘플 데이터
// ======================

type SoldOutStatus = 'ON_SALE' | 'SOLD_OUT';

type StoreMenu = {
  id: number;
  name: string;
  nameEnglish: string;
  category: string;
  price: number;
  calories: number;
  description: string;
  menuCode: string;
  ingredients: string;
  allergens: string[];
  soldOutStatus: SoldOutStatus;
  todaySales: number;
  stockLevel: 'sufficient' | 'low' | 'out';
  lastOrdered: string | null;
  image: string;
};

const sampleMenus: StoreMenu[] = [
  {
    id: 1,
    name: '치킨버거 세트',
    nameEnglish: 'Chicken Burger Set',
    category: '세트',
    price: 12000,
    description: '치킨버거 + 감자튀김 + 음료',
    ingredients: '치킨패티, 양상추, 토마토, 마요네즈, 피클, 감자튀김, 콜라',
    calories: 890,
    allergens: ['계란', '밀', '대두', '닭고기'],
    menuCode: 'SET-CHICKEN-01',
    soldOutStatus: 'ON_SALE',
    todaySales: 28,
    stockLevel: 'sufficient',
    lastOrdered: '2024-12-30 14:30',
    image: '🍔'
  },
  {
    id: 2,
    name: '불고기버거 세트',
    nameEnglish: 'Bulgogi Burger Set',
    category: '세트',
    price: 12500,
    description: '불고기버거 + 감자튀김 + 음료',
    ingredients: '불고기패티, 치즈, 양파, 불고기소스, 감자튀김, 콜라',
    calories: 950,
    allergens: ['밀', '대두', '우유', '쇠고기'],
    menuCode: 'SET-BULGOGI-01',
    soldOutStatus: 'ON_SALE',
    todaySales: 24,
    stockLevel: 'sufficient',
    lastOrdered: '2024-12-30 13:45',
    image: '🍔'
  },
  {
    id: 3,
    name: '새우버거 세트',
    nameEnglish: 'Shrimp Burger Set',
    category: '세트',
    price: 13000,
    description: '새우버거 + 감자튀김 + 음료',
    ingredients: '새우패티, 아보카도, 양상추, 타르타르소스, 감자튀김, 콜라',
    calories: 860,
    allergens: ['갑각류', '계란', '밀', '대두'],
    menuCode: 'SET-SHRIMP-01',
    soldOutStatus: 'SOLD_OUT',
    todaySales: 18,
    stockLevel: 'out',
    lastOrdered: '2024-12-30 12:20',
    image: '🍤'
  },
  {
    id: 4,
    name: '햄치즈 토스트',
    nameEnglish: 'Ham Cheese Toast',
    category: '토스트',
    price: 4500,
    description: '바삭한 토스트에 햄과 치즈를 넣은 클래식 토스트',
    ingredients: '식빵, 햄, 치즈, 버터',
    calories: 380,
    allergens: ['밀', '우유', '돼지고기'],
    menuCode: 'TOAST-HAMCHEESE-01',
    soldOutStatus: 'ON_SALE',
    todaySales: 22,
    stockLevel: 'sufficient',
    lastOrdered: '2024-12-30 14:10',
    image: '🍞'
  },
  {
    id: 5,
    name: '참치 토스트',
    nameEnglish: 'Tuna Toast',
    category: '토스트',
    price: 5000,
    description: '참치와 야채가 들어간 영양만점 토스트',
    ingredients: '식빵, 참치, 양파, 마요네즈, 치즈',
    calories: 420,
    allergens: ['밀', '생선', '계란', '우유'],
    menuCode: 'TOAST-TUNA-01',
    soldOutStatus: 'ON_SALE',
    todaySales: 18,
    stockLevel: 'low',
    lastOrdered: '2024-12-30 13:55',
    image: '🍞'
  },
  {
    id: 6,
    name: '피자 토스트',
    nameEnglish: 'Pizza Toast',
    category: '토스트',
    price: 5500,
    description: '피자처럼 토핑을 올린 특별한 토스트',
    ingredients: '식빵, 토마토소스, 치즈, 햄, 피망, 양파',
    calories: 480,
    allergens: ['밀', '우유', '토마토', '돼지고기'],
    menuCode: 'TOAST-PIZZA-01',
    soldOutStatus: 'ON_SALE',
    todaySales: 15,
    stockLevel: 'sufficient',
    lastOrdered: '2024-12-30 12:40',
    image: '🍕'
  },
  {
    id: 7,
    name: '감자튀김(L)',
    nameEnglish: 'French Fries (L)',
    category: '사이드',
    price: 3500,
    description: '바삭하게 튀긴 황금 감자튀김',
    ingredients: '감자, 식용유, 소금',
    calories: 320,
    allergens: [],
    menuCode: 'SIDE-FRIES-L',
    soldOutStatus: 'ON_SALE',
    todaySales: 35,
    stockLevel: 'low',
    lastOrdered: '2024-12-30 14:25',
    image: '🍟'
  },
  {
    id: 8,
    name: '치킨너겟(6조각)',
    nameEnglish: 'Chicken Nuggets (6pcs)',
    category: '사이드',
    price: 4000,
    description: '바삭한 치킨너겟 6조각',
    ingredients: '치킨, 튀김옷, 식용유',
    calories: 420,
    allergens: ['닭고기', '밀', '계란'],
    menuCode: 'SIDE-NUGGETS-06',
    soldOutStatus: 'ON_SALE',
    todaySales: 25,
    stockLevel: 'sufficient',
    lastOrdered: '2024-12-30 14:15',
    image: '🍗'
  },
  {
    id: 9,
    name: '양파링',
    nameEnglish: 'Onion Rings',
    category: '사이드',
    price: 3000,
    description: '바삭한 양파링',
    ingredients: '양파, 튀김옷, 식용유',
    calories: 280,
    allergens: ['밀', '계란'],
    menuCode: 'SIDE-ONIONRING-01',
    soldOutStatus: 'ON_SALE',
    todaySales: 12,
    stockLevel: 'sufficient',
    lastOrdered: '2024-12-30 13:20',
    image: '🧅'
  },
  {
    id: 10,
    name: '콜라(L)',
    nameEnglish: 'Coke (L)',
    category: '음료',
    price: 2500,
    description: '시원하고 상쾌한 콜라',
    ingredients: '탄산수, 콜라시럽, 얼음',
    calories: 150,
    allergens: [],
    menuCode: 'DRINK-COKE-L',
    soldOutStatus: 'ON_SALE',
    todaySales: 42,
    stockLevel: 'sufficient',
    lastOrdered: '2024-12-30 14:32',
    image: '🥤'
  },
  {
    id: 11,
    name: '사이다(L)',
    nameEnglish: 'Sprite (L)',
    category: '음료',
    price: 2500,
    description: '시원하고 깔끔한 사이다',
    ingredients: '탄산수, 사이다시럽, 얼음',
    calories: 140,
    allergens: [],
    menuCode: 'DRINK-SPRITE-L',
    soldOutStatus: 'ON_SALE',
    todaySales: 28,
    stockLevel: 'sufficient',
    lastOrdered: '2024-12-30 14:20',
    image: '🥤'
  },
  {
    id: 12,
    name: '아메리카노',
    nameEnglish: 'Americano',
    category: '음료',
    price: 3000,
    description: '깊고 진한 아메리카노',
    ingredients: '에스프레소, 물',
    calories: 10,
    allergens: [],
    menuCode: 'DRINK-AMERICANO-01',
    soldOutStatus: 'ON_SALE',
    todaySales: 35,
    stockLevel: 'sufficient',
    lastOrdered: '2024-12-30 14:28',
    image: '☕'
  },
  {
    id: 13,
    name: '카페라떼',
    nameEnglish: 'Caffe Latte',
    category: '음료',
    price: 3500,
    description: '부드럽고 달콤한 카페라떼',
    ingredients: '에스프레소, 우유, 시럽',
    calories: 180,
    allergens: ['우유'],
    menuCode: 'DRINK-LATTE-01',
    soldOutStatus: 'ON_SALE',
    todaySales: 22,
    stockLevel: 'low',
    lastOrdered: '2024-12-30 13:50',
    image: '☕'
  }
];

// ======================
// 컴포넌트
// ======================

export function StoreMenuManagement() {
  const [menus, setMenus] = useState<StoreMenu[]>(sampleMenus);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<StoreMenu | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { dialog, confirm } = useConfirmDialog();

  const categories = [
    { label: '전체', value: 'all', count: menus.length },
    { label: '세트', value: '세트', count: menus.filter(m => m.category === '세트').length },
    { label: '토스트', value: '토스트', count: menus.filter(m => m.category === '토스트').length },
    { label: '사이드', value: '사이드', count: menus.filter(m => m.category === '사이드').length },
    { label: '음료', value: '음료', count: menus.filter(m => m.category === '음료').length },
    {
      label: '판매중',
      value: 'available',
      count: menus.filter(m => m.soldOutStatus === 'ON_SALE').length
    },
    {
      label: '품절',
      value: 'soldout',
      count: menus.filter(m => m.soldOutStatus === 'SOLD_OUT').length
    }
  ];

  // 필터링된 메뉴
  const filteredMenus = menus.filter(menu => {
    const matchesSearch =
      searchTerm === '' ||
      menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      menu.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' ||
      menu.category === selectedCategory ||
      (selectedCategory === 'available' && menu.soldOutStatus === 'ON_SALE') ||
      (selectedCategory === 'soldout' && menu.soldOutStatus === 'SOLD_OUT');

    return matchesSearch && matchesCategory;
  });

  // 본사 메뉴 등록 폼 구조를 그대로 가져온 가맹점용 필드
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
        { value: '음료', label: '음료' }
      ]
    },
    {
      name: 'name',
      label: '메뉴명 *',
      type: 'text' as const,
      required: true,
      placeholder: '예: 베이컨 에그 토스트'
    },
    {
      name: 'nameEnglish',
      label: '영문명 *',
      type: 'text' as const,
      required: true,
      placeholder: '예: Bacon Egg Toast'
    },
    {
      name: 'price',
      label: '가격(원) *',
      type: 'number' as const,
      required: true,
      placeholder: '4500'
    },
    {
      name: 'calories',
      label: '칼로리(kcal) *',
      type: 'number' as const,
      required: true,
      placeholder: '예: 320'
    },
    {
      name: 'description',
      label: '설명 *',
      type: 'textarea' as const,
      required: true,
      placeholder: '상품 설명'
    },
    {
      name: 'menuCode',
      label: '상품코드 *',
      type: 'text' as const,
      required: true,
      placeholder: '상품 코드'
    },
    {
      name: 'allergens',
      label: '알러지 정보',
      type: 'textarea' as const,
      required: false,
      placeholder: '알러지 유발 성분을 쉼표로 구분하여 입력하세요 (예: 계란, 밀, 우유)'
    }
  ];

  // 판매 상태 토글 (판매중 <-> 품절)
  const handleToggleStatus = (menuId: number, isOnSale: boolean) => {
    setMenus(prev =>
      prev.map(menu =>
        menu.id === menuId
          ? { ...menu, soldOutStatus: isOnSale ? 'ON_SALE' : 'SOLD_OUT' }
          : menu
      )
    );

    const menuName = menus.find(m => m.id === menuId)?.name;
    toast.success(
      `${menuName}을(를) ${isOnSale ? '판매중으로 변경했습니다.' : '품절 처리했습니다.'}`
    );
  };

  const handleSoldOut = (menu: StoreMenu) => {
    confirm({
      title: '품절 처리',
      description: `${menu.name}을(를) 품절 처리하시겠습니까?`,
      type: 'warning',
      confirmText: '품절 처리',
      onConfirm: () => {
        setMenus(prev =>
          prev.map(m =>
            m.id === menu.id ? { ...m, soldOutStatus: 'SOLD_OUT' as SoldOutStatus } : m
          )
        );
        toast.success(`${menu.name}을(를) 품절 처리했습니다.`);
      }
    });
  };

  const handleRestock = (menu: StoreMenu) => {
    setMenus(prev =>
      prev.map(m =>
        m.id === menu.id
          ? {
              ...m,
              soldOutStatus: 'ON_SALE' as SoldOutStatus,
              stockLevel: 'sufficient'
            }
          : m
      )
    );
    toast.success(`${menu.name} 재입고 완료되었습니다.`);
  };

  const handleAdd = () => {
    setIsModalOpen(true);
  };

  const handleMenuDetail = (menu: StoreMenu) => {
    setSelectedMenu(menu);
    setIsDetailModalOpen(true);
  };

  const handleSubmit = async (data: any) => {
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newId = menus.length ? Math.max(...menus.map(m => m.id)) + 1 : 1;

      const newMenu: StoreMenu = {
        id: newId,
        name: data.name,
        nameEnglish: data.nameEnglish,
        category: data.category,
        price: Number(data.price) || 0,
        calories: Number(data.calories) || 0,
        description: data.description || '',
        menuCode: data.menuCode || '',
        ingredients: '', // 가맹점 등록에서는 간단 입력만, 추후 본사 동기화 가능
        allergens: data.allergens
          ? data.allergens
              .split(',')
              .map((item: string) => item.trim())
              .filter((item: string) => item.length > 0)
          : [],
        soldOutStatus: 'ON_SALE',
        todaySales: 0,
        stockLevel: 'sufficient',
        lastOrdered: null,
        image: '🍽️'
      };

      setMenus(prev => [...prev, newMenu]);
      toast.success('새 메뉴가 추가되었습니다.');
      setIsModalOpen(false);
    } catch (error) {
      toast.error('오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>메뉴 관리</h1>
          <p className="text-dark-gray">총 {menus.length}개 항목</p>
        </div>
        <Button onClick={handleAdd} className="bg-kpi-red hover:bg-red-600 text-white">
          + 메뉴 추가
        </Button>
      </div>

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="메뉴명, 키워드로 검색"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-kpi-red focus:border-transparent"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
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

      {/* Menu Grid */}
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <div className="overflow-x-auto">
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
                    오늘 판매
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                    재고상태
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                    판매상태
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMenus.map(menu => (
                  <tr key={menu.id} className="hover:bg-gray-50">
                    {/* 메뉴 정보 */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-kpi-orange rounded-lg flex items-center justify-center text-lg relative">
                          {menu.image}
                          {menu.soldOutStatus === 'SOLD_OUT' && (
                            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                              <span className="text-xs font-bold text-white">품절</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <div
                            className="font-medium cursor-pointer hover:text-kpi-orange transition-colors text-gray-900"
                            onClick={() => handleMenuDetail(menu)}
                          >
                            {menu.name}
                          </div>
                          <div className="text-xs text-gray-500">{menu.nameEnglish}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            코드: {menu.menuCode}
                          </div>
                          <div className="text-xs text-gray-500">{menu.calories}kcal</div>
                        </div>
                      </div>
                    </td>

                    {/* 가격 */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        ₩{(menu.price || 0).toLocaleString()}
                      </div>
                    </td>

                    {/* 오늘 판매 */}
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{menu.todaySales}개</div>
                        <div className="text-xs text-gray-500">
                          {menu.lastOrdered
                            ? `최근: ${new Date(menu.lastOrdered).toLocaleTimeString('ko-KR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}`
                            : '주문 없음'}
                        </div>
                      </div>
                    </td>

                    {/* 재고 상태 */}
                    <td className="px-6 py-4">
                      {menu.soldOutStatus === 'SOLD_OUT' ? (
                        <Badge className="bg-gray-100 text-gray-800">품절</Badge>
                      ) : (
                        <Badge
                          className={
                            menu.stockLevel === 'sufficient'
                              ? 'bg-green-100 text-green-800'
                              : menu.stockLevel === 'low'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {menu.stockLevel === 'sufficient'
                            ? '충분'
                            : menu.stockLevel === 'low'
                            ? '부족'
                            : '없음'}
                        </Badge>
                      )}
                    </td>

                    {/* 판매 상태 (스위치) */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={menu.soldOutStatus === 'ON_SALE'}
                          onCheckedChange={(checked: any) =>
                            handleToggleStatus(menu.id, checked)
                          }
                        />
                        <span
                          className={`text-sm ${
                            menu.soldOutStatus === 'SOLD_OUT'
                              ? 'text-gray-400'
                              : 'text-green-600'
                          }`}
                        >
                          {menu.soldOutStatus === 'SOLD_OUT' ? '품절' : '판매중'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredMenus.length === 0 && (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">메뉴가 없습니다</h3>
              <p className="text-gray-500">조건에 맞는 메뉴가 없습니다.</p>
            </div>
          )}
        </Card>
      </div>

      {/* 품절/재입고 관리 */}
      <Card className="p-6 bg-white rounded-xl shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">재고 관리</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menus
            .filter(m => m.soldOutStatus === 'SOLD_OUT' || m.stockLevel === 'low')
            .map(menu => (
              <div key={menu.id} className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">{menu.image}</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{menu.name}</h4>
                    <p className="text-sm text-dark-gray">{menu.category}</p>
                  </div>
                </div>

                {menu.soldOutStatus === 'SOLD_OUT' ? (
                  <Button
                    onClick={() => handleRestock(menu)}
                    className="w-full bg-kpi-green hover:bg-green-600 text-white"
                    size="sm"
                  >
                    재입고 완료
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSoldOut(menu)}
                    variant="outline"
                    className="w-full border-kpi-orange text-kpi-orange hover:bg-orange-50"
                    size="sm"
                  >
                    품절 처리
                  </Button>
                )}
              </div>
            ))}

          {menus.filter(m => m.soldOutStatus === 'SOLD_OUT' || m.stockLevel === 'low')
            .length === 0 && (
            <div className="col-span-full text-center py-8 text-dark-gray">
              재고 문제가 있는 메뉴가 없습니다.
            </div>
          )}
        </div>
      </Card>

      {/* Form Modal : 본사 폼 구조 + 현 디자인 */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="메뉴 추가"
        fields={formFields}
        onSubmit={handleSubmit}
        initialData={{}}
        isLoading={isLoading}
        maxWidth="md"
      />

      {/* Menu Detail Modal with Scroll */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] p-0">
          <DialogHeader className="px-6 py-4 border-b bg-gray-50">
            <DialogTitle className="text-lg">메뉴 상세 정보</DialogTitle>
            <DialogDescription className="text-sm">
              선택한 메뉴의 상세 정보와 판매 데이터를 확인할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          {selectedMenu && (
            <ScrollArea className="flex-1 px-6 py-4 max-h-[calc(85vh-120px)]">
              <div className="space-y-6 pr-4">
                {/* 메뉴 기본 정보 */}
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-kpi-orange to-kpi-red rounded-xl flex items-center justify-center text-3xl relative">
                    {selectedMenu.image}
                    {selectedMenu.soldOutStatus === 'SOLD_OUT' && (
                      <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                        <span className="text-sm font-bold text-white">품절</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {selectedMenu.name}
                        </h3>
                        <div className="text-xs text-gray-500">
                          {selectedMenu.nameEnglish}
                        </div>
                      </div>
                      <Badge
                        className={
                          selectedMenu.category === '세트'
                            ? 'bg-kpi-red text-white'
                            : selectedMenu.category === '토스트'
                            ? 'bg-kpi-orange text-white'
                            : selectedMenu.category === '사이드'
                            ? 'bg-kpi-green text-white'
                            : 'bg-kpi-purple text-white'
                        }
                      >
                        {selectedMenu.category}
                      </Badge>
                    </div>
                    <p className="text-dark-gray mb-3">{selectedMenu.description}</p>
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-kpi-red">
                        ₩{(selectedMenu.price || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        상품코드: {selectedMenu.menuCode}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 상세 정보 그리드 */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-kpi-purple" />
                      <h4 className="font-medium text-gray-900">영양 정보</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-dark-gray">칼로리</span>
                        <span className="font-medium">
                          {selectedMenu.calories}kcal
                        </span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="w-4 h-4 text-kpi-green" />
                      <h4 className="font-medium text-gray-900">판매 현황</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-dark-gray">오늘 판매</span>
                        <span className="font-medium text-kpi-green">
                          {selectedMenu.todaySales}개
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-gray">재고 상태</span>
                        <Badge
                          className={
                            selectedMenu.stockLevel === 'sufficient'
                              ? 'bg-kpi-green text-white'
                              : selectedMenu.stockLevel === 'low'
                              ? 'bg-kpi-orange text-white'
                              : 'bg-kpi-red text-white'
                          }
                        >
                          {selectedMenu.stockLevel === 'sufficient'
                            ? '충분'
                            : selectedMenu.stockLevel === 'low'
                            ? '부족'
                            : '없음'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-gray">판매 상태</span>
                        <Badge
                          className={
                            selectedMenu.soldOutStatus === 'SOLD_OUT'
                              ? 'bg-gray-500 text-white'
                              : 'bg-kpi-green text-white'
                          }
                        >
                          {selectedMenu.soldOutStatus === 'SOLD_OUT' ? '품절' : '판매중'}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* 재료 정보 */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ChefHat className="w-4 h-4 text-kpi-orange" />
                    <h4 className="font-medium text-gray-900">재료 정보</h4>
                  </div>
                  <p className="text-dark-gray leading-relaxed">
                    {selectedMenu.ingredients || '등록된 재료 정보가 없습니다.'}
                  </p>
                </Card>

                {/* 알러지 정보 */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-kpi-red" />
                    <h4 className="font-medium text-gray-900">알러지 정보</h4>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedMenu.allergens && selectedMenu.allergens.length > 0 ? (
                      selectedMenu.allergens.map((allergen: string, index: number) => (
                        <Badge key={index} className="bg-kpi-red text-white">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {allergen}
                        </Badge>
                      ))
                    ) : (
                      <div className="text-dark-gray">
                        알러지 유발 가능 성분이 없습니다.
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-kpi-orange">
                    <p className="text-sm text-orange-800">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      알러지가 있으신 분은 주의해 주세요. 조리 과정에서 다른 알러지 성분과
                      교차 오염될 수 있습니다.
                    </p>
                  </div>
                </Card>

                {/* 최근 주문 정보 */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-kpi-purple" />
                    <h4 className="font-medium text-gray-900">최근 주문</h4>
                  </div>
                  <div className="text-dark-gray">
                    {selectedMenu.lastOrdered ? (
                      <div>
                        <span>마지막 주문: </span>
                        <span className="font-medium text-gray-900">
                          {new Date(selectedMenu.lastOrdered).toLocaleString('ko-KR')}
                        </span>
                      </div>
                    ) : (
                      '주문 내역이 없습니다.'
                    )}
                  </div>
                </Card>

                {/* 액션 버튼 */}
                <div className="sticky bottom-0 bg-white pt-4 border-t">
                  <div className="flex gap-3">
                    {selectedMenu.soldOutStatus === 'SOLD_OUT' ? (
                      <Button
                        onClick={() => {
                          handleRestock(selectedMenu);
                          setIsDetailModalOpen(false);
                        }}
                        className="bg-kpi-green hover:bg-green-600 text-white"
                      >
                        <Package className="w-4 h-4 mr-2" />
                        재입고 완료
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          handleSoldOut(selectedMenu);
                          setIsDetailModalOpen(false);
                        }}
                        variant="outline"
                        className="border-kpi-orange text-kpi-orange hover:bg-orange-50"
                      >
                        <Power className="w-4 h-4 mr-2" />
                        품절 처리
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => setIsDetailModalOpen(false)}
                      className="ml-auto"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      닫기
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      {dialog}
    </div>
  );
}
