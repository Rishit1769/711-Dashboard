import { ArrowDown, ArrowUp, ChevronsUpDown, Download, Search } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right" | undefined;
  sortable?: boolean | undefined;
  value?: ((row: T) => string | number) | undefined;
  render?: ((row: T) => ReactNode) | undefined;
  className?: string | undefined;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  searchPlaceholder?: string | undefined;
  searchValue?: ((row: T) => string) | undefined;
  pageSize?: number | undefined;
  onRowClick?: ((row: T) => void) | undefined;
  emptyMessage?: string | undefined;
  exportName?: string | undefined;
  toolbar?: ReactNode | undefined;
}

function toCsv<T>(rows: T[], columns: Column<T>[]) {
  const head = columns.map((c) => `"${c.header}"`).join(",");
  const body = rows.map((row) =>
    columns
      .map((c) => {
        const raw = c.value ? c.value(row) : "";
        return `"${String(raw).replace(/"/g, '""')}"`;
      })
      .join(","),
  );
  return [head, ...body].join("\n");
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  searchPlaceholder = "Search…",
  searchValue,
  pageSize = 8,
  onRowClick,
  emptyMessage = "No records available for the selected period.",
  exportName,
  toolbar,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !searchValue) return rows;
    return rows.filter((r) => searchValue(r).toLowerCase().includes(q));
  }, [rows, query, searchValue]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.value) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = col.value!(a);
      const bv = col.value!(b);
      if (typeof av === "number" && typeof bv === "number") return dir === "asc" ? av - bv : bv - av;
      return dir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return copy;
  }, [filtered, sortKey, dir, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const visible = sorted.slice(current * pageSize, current * pageSize + pageSize);

  const download = () => {
    const csv = toCsv(sorted, columns);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportName ?? "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4">
      {(searchValue || toolbar || exportName) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {searchValue ? (
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(0);
                  }}
                  placeholder={searchPlaceholder}
                  className="h-9 w-56 pl-9"
                />
              </div>
            ) : null}
            {toolbar}
          </div>
          {exportName ? (
            <Button variant="outline" size="sm" onClick={download}>
              <Download className="size-4" /> Export CSV
            </Button>
          ) : null}
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <>
          <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  {columns.map((c) => {
                    const isSorted = sortKey === c.key;
                    return (
                      <th
                        key={c.key}
                        className={cn(
                          "whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                          c.align === "right" ? "text-right" : "text-left",
                        )}
                      >
                        {c.sortable !== false && c.value ? (
                          <button
                            type="button"
                            className={cn(
                              "inline-flex items-center gap-1 transition-colors hover:text-foreground",
                              c.align === "right" && "flex-row-reverse",
                              isSorted && "text-foreground",
                            )}
                            onClick={() => {
                              if (isSorted) setDir(dir === "asc" ? "desc" : "asc");
                              else {
                                setSortKey(c.key);
                                setDir("desc");
                              }
                            }}
                          >
                            {c.header}
                            {isSorted ? (
                              dir === "asc" ? (
                                <ArrowUp className="size-3" />
                              ) : (
                                <ArrowDown className="size-3" />
                              )
                            ) : (
                              <ChevronsUpDown className="size-3 opacity-50" />
                            )}
                          </button>
                        ) : (
                          c.header
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "border-b border-border/70 last:border-0",
                      onRowClick && "cursor-pointer transition-colors hover:bg-secondary/60",
                    )}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={cn(
                          "px-3 py-3 align-middle",
                          c.align === "right" && "text-right tabular",
                          c.className,
                        )}
                      >
                        {c.render ? c.render(row) : c.value ? String(c.value(row)) : null}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              Showing {current * pageSize + 1}–{Math.min(sorted.length, (current + 1) * pageSize)} of{" "}
              {sorted.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={current === 0}
                onClick={() => setPage(current - 1)}
              >
                Previous
              </Button>
              <span className="tabular">
                {current + 1} / {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={current >= pageCount - 1}
                onClick={() => setPage(current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
