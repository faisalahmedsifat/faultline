"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"

export function ErrorFilters({
  page,
  totalPages
}: {
  page: number
  totalPages: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const searchParamsRef = useRef(searchParams)
  searchParamsRef.current = searchParams

  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "")

  useEffect(() => {
    setSearchInput(searchParams.get("search") ?? "")
  }, [searchParams])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams)
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    if (key !== "page") params.delete("page")
    router.push(`${pathname}?${params}`)
  }

  function debouncedSetSearch(value: string) {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParamsRef.current)
      if (value) {
        params.set("search", value)
      } else {
        params.delete("search")
      }
      params.delete("page")
      router.push(`${pathname}?${params}`)
    }, 300)
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams)
    if (p <= 1) {
      params.delete("page")
    } else {
      params.set("page", String(p))
    }
    router.push(`${pathname}?${params}`)
  }

  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg rounded-xl border border-border flex items-center gap-0 overflow-hidden">
        <Tabs
          value={searchParams.get("status") ?? "all"}
          onValueChange={(v) => setParam("status", v === "all" ? "" : v)}
        >
          <TabsList className="bg-transparent h-10 px-2">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="open" className="text-xs">Open</TabsTrigger>
            <TabsTrigger value="ignored" className="text-xs">Ignored</TabsTrigger>
            <TabsTrigger value="resolved" className="text-xs">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>

        <Separator orientation="vertical" className="h-5" />

        <Select
          value={searchParams.get("env") ?? "all"}
          onValueChange={(v) => setParam("env", v === "all" ? "" : v ?? "")}
        >
          <SelectTrigger className="h-8 w-[110px] border-0 bg-transparent text-xs mx-2 shadow-none">
            <SelectValue placeholder="Env" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All envs</SelectItem>
            <SelectItem value="production">production</SelectItem>
            <SelectItem value="staging">staging</SelectItem>
            <SelectItem value="development">development</SelectItem>
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-5" />

        <div className="relative flex-1 ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
          <Input
            className="pl-8 h-10 border-0 bg-transparent text-xs shadow-none rounded-none focus:ring-0"
            placeholder="Search errors..."
            value={searchInput}
            onChange={(e) => debouncedSetSearch(e.target.value)}
          />
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs tabular-nums">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-xs"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
