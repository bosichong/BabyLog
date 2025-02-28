import { Button } from "@/components/ui/button";

export function Pagination({ page, total, onPageChange }) {
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  const maxVisiblePages = 5;
  
  // 计算要显示的页码范围
  let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(total, startPage + maxVisiblePages - 1);
  
  // 调整起始页码，确保显示正确数量的页码
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  // 生成要显示的页码数组
  const visiblePages = pages.slice(startPage - 1, endPage);

  return (
    <nav className="flex items-center space-x-2" aria-label="Pagination">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        <span className="sr-only">上一页</span>
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </Button>
      
      {startPage > 1 && (
        <>
          <Button
            variant={page === 1 ? "secondary" : "outline"}
            size="icon"
            onClick={() => onPageChange(1)}
          >
            1
          </Button>
          {startPage > 2 && (
            <span className="px-2 text-gray-400">...</span>
          )}
        </>
      )}
      
      {visiblePages.map((pageNum) => (
        <Button
          key={pageNum}
          variant={page === pageNum ? "secondary" : "outline"}
          size="icon"
          onClick={() => onPageChange(pageNum)}
        >
          {pageNum}
        </Button>
      ))}
      
      {endPage < total && (
        <>
          {endPage < total - 1 && (
            <span className="px-2 text-gray-400">...</span>
          )}
          <Button
            variant={page === total ? "secondary" : "outline"}
            size="icon"
            onClick={() => onPageChange(total)}
          >
            {total}
          </Button>
        </>
      )}
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.min(total, page + 1))}
        disabled={page === total}
      >
        <span className="sr-only">下一页</span>
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </Button>
    </nav>
  );
}