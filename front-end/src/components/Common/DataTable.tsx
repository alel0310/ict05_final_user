import React, { useState, useMemo } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Download, MoreHorizontal, ChevronUp, ChevronDown, Edit, Trash2, Eye, Search } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export interface Column<Row = any> {
  key: string;
  label: string | React.ReactNode;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: Row) => React.ReactNode;
}

export interface DataTableProps {
  data: any[];
  columns: Column[];
  title: string;
  searchPlaceholder?: string;
  onAdd?: () => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onView?: (row: any) => void;
  addButtonText?: string;
  showActions?: boolean;
  filters?: { label: string; value: string; count?: number }[];
  onExport?: () => void;
  hideSearch?: boolean;

  // ✅ 추가된 서버 페이징 관련 props
  serverSidePagination?: boolean;
  currentPage?: number; // 외부 제어
  totalPageCount?: number;
  onPageChange?: (page: number) => void;
  totalElements?: number;
}

export function DataTable({
  data = [],
  columns = [],
  title = '데이터 테이블',
  searchPlaceholder = '검색어를 입력하세요',
  onAdd,
  onEdit,
  onDelete,
  onView,
  addButtonText = '등록',
  showActions = true,
  filters = [],
  onExport,
  hideSearch = false,

  // ✅ 추가된 props 기본값
  serverSidePagination = false,
  currentPage: externalPage = 1,
  totalPageCount: externaltotalPageCount = 1,
  onPageChange,
  totalElements = 0,
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // ✅ 내부 페이지 상태 (클라이언트 모드에서만 사용)
  const [internalPage, setInternalPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // ✅ 서버모드일 때 외부 페이지, 아니면 내부 페이지
  const currentPage = serverSidePagination ? externalPage : internalPage;

  // 검색 및 필터링
  const filteredData = useMemo(() => {
    const safeData = Array.isArray(data) ? data.filter((row) => row && typeof row === 'object') : [];
    let filtered = safeData;

    if (!hideSearch && searchTerm) {
      filtered = filtered.filter((row) =>
        Object.values(row).some((val) => String(val ?? '').toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }

    if (activeFilter !== 'all') {
      filtered = filtered.filter((row) => row.status === activeFilter);
    }

    return filtered;
  }, [data, searchTerm, activeFilter, hideSearch]);

  // 정렬
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // ✅ 페이지 데이터 계산
  const paginatedData = useMemo(() => {
    if (serverSidePagination) return sortedData;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage, serverSidePagination]);

  const totalPageCount = serverSidePagination
    ? externaltotalPageCount
    : Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-dark-gray">
            총 {serverSidePagination ? totalElements : filteredData.length}개 항목
          </p>
        </div>
        <div className="flex items-center gap-3">
          {onExport && (
            <Button variant="outline" onClick={onExport} className="gap-2">
              <Download className="w-4 h-4" />
              내보내기
            </Button>
          )}
          {onAdd && (
            <Button onClick={onAdd} className="bg-kpi-red hover:bg-red-600 text-white gap-2">
              <span>+ {addButtonText}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      {!hideSearch && (
        <Card className="p-4 bg-white rounded-xl shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-dark-gray absolute left-3 top-1/2 transform -translate-y-1/2" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {filters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    activeFilter === 'all'
                      ? 'bg-kpi-red text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  전체 ({data.length})
                </button>
                {filters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setActiveFilter(filter.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      activeFilter === filter.value
                        ? 'bg-kpi-red text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Table */}
      <Card className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-light-gray border-b">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-6 py-4 text-left text-sm font-semibold text-gray-900 ${
                      col.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                    }`}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      {col.sortable && renderSortIcon(col.key)}
                    </div>
                  </th>
                ))}
                {showActions && <th className="px-6 py-4 text-sm font-semibold text-gray-900 w-24">액션</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedData.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 text-sm text-gray-900">
                      {col.render ? col.render(row[col.key], row) : row[col.key] ?? '-'}
                    </td>
                  ))}
                  {showActions && (
                    <td className="px-6 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onView && (
                            <DropdownMenuItem onClick={() => onView(row)}>
                              <Eye className="w-4 h-4 mr-2" /> 상세보기
                            </DropdownMenuItem>
                          )}
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(row)}>
                              <Edit className="w-4 h-4 mr-2" /> 수정
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem onClick={() => onDelete(row)} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" /> 삭제
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-dark-gray">데이터가 없습니다.</p>
          </div>
        )}

        {/* ✅ Pagination */}
        {totalPageCount > 1 && (
          <div className="px-6 py-4 border-t bg-light-gray flex items-center justify-between">
            <p className="text-sm text-dark-gray">
              {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedData.length)} / {sortedData.length}개
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => onPageChange && onPageChange(currentPage - 1)}
              >
                이전
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPageCount }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange && onPageChange(page)}
                    className={currentPage === page ? "bg-kpi-red text-white" : ""}
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPageCount}
                onClick={() => onPageChange && onPageChange(currentPage + 1)}
              >
                다음
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
