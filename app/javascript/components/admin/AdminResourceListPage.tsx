import React from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { adminDelete, adminGetJson, adminPostJson } from "./api"
import type { AdminAction, AdminListResponse } from "./types"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Plus, Search } from "lucide-react"

function renderValue(type: string, value: any) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">—</span>
  }

  if (type === "boolean") {
    return <Badge variant={value ? "default" : "secondary"}>{value ? "Yes" : "No"}</Badge>
  }

  if (type === "badge") {
    return <Badge variant="secondary">{String(value)}</Badge>
  }

  if (type === "datetime") {
    return new Date(value).toLocaleString()
  }

  return String(value)
}

export default function AdminResourceListPage() {
  const { toast } = useToast()
  const { resourceKey = "" } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [payload, setPayload] = React.useState<AdminListResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [searchInput, setSearchInput] = React.useState(searchParams.get("query") || "")

  const scope = searchParams.get("scope") || "all"
  const query = searchParams.get("query") || ""
  const page = searchParams.get("page") || "1"

  const fetchResource = React.useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (scope) params.set("scope", scope)
      if (query) params.set("query", query)
      if (page) params.set("page", page)
      const result = await adminGetJson<AdminListResponse>(`/api/admin/${resourceKey}?${params.toString()}`)
      setPayload(result)
    } catch (error: any) {
      toast({
        title: "Admin resource failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [page, query, resourceKey, scope, toast])

  React.useEffect(() => {
    fetchResource()
  }, [fetchResource])

  React.useEffect(() => {
    setSearchInput(query)
  }, [query])

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (searchInput === query) return

      const next = new URLSearchParams(searchParams)
      if (searchInput) {
        next.set("query", searchInput)
      } else {
        next.delete("query")
      }
      next.delete("page")
      setSearchParams(next)
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [query, searchInput, searchParams, setSearchParams])

  const handleScopeChange = (nextScope: string) => {
    const next = new URLSearchParams(searchParams)
    if (nextScope === "all") {
      next.delete("scope")
    } else {
      next.set("scope", nextScope)
    }
    next.delete("page")
    setSearchParams(next)
  }

  const handlePageChange = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set("page", String(nextPage))
    setSearchParams(next)
  }

  const runAction = async (action: AdminAction) => {
    try {
      if (action.kind === "delete" && action.endpoint) {
        if (!window.confirm("Delete this record?")) return
        await adminDelete(action.endpoint)
        toast({ title: "Record deleted" })
        fetchResource()
        return
      }

      if (action.kind === "custom" && action.endpoint) {
        await adminPostJson(action.endpoint)
        toast({ title: "Action completed" })
        fetchResource()
        return
      }
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-card-foreground shadow-sm">Loading {resourceKey}...</div>
  }

  if (!payload) {
    return <div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-8 text-destructive">Resource unavailable.</div>
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-2xl">{payload.resource.label}</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">{payload.resource.description}</p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <div className="relative min-w-[260px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="pl-9"
                placeholder={`Search ${payload.resource.label.toLowerCase()}...`}
              />
            </div>
            {payload.resource.creatable && (
              <Button asChild className="gap-2">
                <Link to={`/admin/${resourceKey}/new`}>
                  <Plus className="h-4 w-4" />
                  New record
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {payload.resource.scopes.map((resourceScope) => (
              <Button
                key={resourceScope.key}
                type="button"
                variant={resourceScope.key === payload.scope ? "default" : "outline"}
                onClick={() => handleScopeChange(resourceScope.key)}
                className="rounded-full"
              >
                {resourceScope.label}
              </Button>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                {payload.resource.columns.map((column) => (
                  <TableHead key={column.key}>{column.label}</TableHead>
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payload.records.map((record) => (
                <TableRow key={record.id}>
                  {payload.resource.columns.map((column) => (
                    <TableCell key={`${record.id}-${column.key}`}>
                      {renderValue(column.type, record.values[column.key])}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    {record.actions.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {record.actions.map((action) => {
                            if ((action.kind === "navigate" || action.kind === "link") && action.to) {
                              return (
                                <DropdownMenuItem key={action.key} asChild>
                                  <Link to={action.to}>{action.label}</Link>
                                </DropdownMenuItem>
                              )
                            }

                            return (
                              <DropdownMenuItem key={action.key} onClick={() => runAction(action)}>
                                {action.label}
                              </DropdownMenuItem>
                            )
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {payload.records.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-10 text-center text-muted-foreground">
              No records matched this view.
            </div>
          )}

          {payload.pagination.total_pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {payload.pagination.current_page} of {payload.pagination.total_pages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={payload.pagination.current_page <= 1}
                  onClick={() => handlePageChange(payload.pagination.current_page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={payload.pagination.current_page >= payload.pagination.total_pages}
                  onClick={() => handlePageChange(payload.pagination.current_page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
