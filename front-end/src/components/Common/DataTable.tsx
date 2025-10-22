import React, { useState, useMemo } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { StatusBadge } from './StatusBadge';

export interface Column<Row = any> {
  key: string;
  label: string | React.ReactNode; // ✅ ReactNode 허용
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
}

export function DataTable({
  data = [],
  columns = [],
  title = "데이터 테이블",
  searchPlaceholder = "검색어를 입력하세요",
  onAdd,
  onEdit,
  onDelete,
  onView,
  addButtonText = "등록",
  showActions = true,
  filters = [],
  onExport,
  hideSearch = false
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Validate props
  React.useEffect(() => {
    if (!Array.isArray(data)) {
      console.warn('DataTable: data prop is not an array:', data);
    }
    if (!Array.isArray(columns)) {
      console.warn('DataTable: columns prop is not an array:', columns);
    }
  }, [data, columns]);

  // 검색 및 필터링
  const filteredData = useMemo(() => {
    // 안전한 data 배열 확인
    const safeData = Array.isArray(data) ? data.filter(row => row && typeof row === 'object') : [];
    let filtered = safeData;

    // hideSearch가 true이면 검색하지 않음
    if (!hideSearch && searchTerm && filtered.length > 0) {
      filtered = filtered.filter(row => {
        if (!row || typeof row !== 'object') return false;
        
        return Object.values(row).some(value => {
          if (value === null || value === undefined) return false;
          try {
            return String(value).toLowerCase().includes(searchTerm.toLowerCase());
          } catch (error) {
            console.warn('DataTable search error:', error, value);
            return false;
          }
        });
      });
    }

    // 필터
    if (activeFilter !== 'all' && filtered.length > 0) {
      filtered = filtered.filter(row => {
        if (!row || typeof row !== 'object') return false;
        // 상태 필터링 (status 필드 기준)
        return row.status === activeFilter;
      });
    }

    return filtered;
  }, [data, searchTerm, activeFilter, hideSearch]);

  // 정렬
  const sortedData = useMemo(() => {
    if (!sortColumn || !Array.isArray(filteredData)) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // 페이지네이션
  const paginatedData = useMemo(() => {
    if (!Array.isArray(sortedData)) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil((Array.isArray(sortedData) ? sortedData.length : 0) / itemsPerPage);

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
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-dark-gray">
            총 {filteredData.length}개 항목
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
            <Button 
              onClick={onAdd}
              className="bg-kpi-red hover:bg-red-600 text-white gap-2"
            >
              <span>+ {addButtonText}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      {!hideSearch && (
        <Card className="p-4 bg-white rounded-xl shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-dark-gray absolute left-3 top-1/2 transform -translate-y-1/2" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Tabs */}
            {filters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeFilter === filter.value
                        ? 'bg-kpi-red text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label} {filter.count && `(${filter.count})`}
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
                {columns.filter(column => column && column.key).map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-4 text-left text-sm font-semibold text-gray-900 ${
                      column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                    } ${column.width ? column.width : ''}`}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable && renderSortIcon(column.key)}
                    </div>
                  </th>
                ))}
                {showActions && (
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-24">
                    액션
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  {columns.filter(column => column && column.key).map((column) => (
                    <td key={column.key} className="px-6 py-4 text-sm text-gray-900">
                      {(() => {
                        try {
                          const value = row?.[column.key];
                          return column.render ? column.render(value, row) : value || '-';
                        } catch (error) {
                          console.warn('DataTable render error:', error);
                          return '-';
                        }
                      })()}
                    </td>
                  ))}
                  {showActions && (
                    <td className="px-6 py-4 text-sm">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onView && (
                            <DropdownMenuItem onClick={() => onView(row)}>
                              <Eye className="w-4 h-4 mr-2" />
                              상세보기
                            </DropdownMenuItem>
                          )}
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(row)}>
                              <Edit className="w-4 h-4 mr-2" />
                              수정
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem 
                              onClick={() => onDelete(row)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              삭제
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

        {/* Empty State */}
        {paginatedData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-dark-gray">데이터가 없습니다.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t bg-light-gray flex items-center justify-between">
            <p className="text-sm text-dark-gray">
              {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, sortedData.length)} / {sortedData.length}개
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                이전
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? "bg-kpi-red text-white" : ""}
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
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