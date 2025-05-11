
import React from "react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, MoreHorizontal, Edit, Copy, Trash2, Eye, Music, Bell } from "lucide-react"

import { get } from "@rails/request.js"

export default function CoursesAdminPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [courses, setCourses] = useState<any[]>([])

  React.useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await get("/courses/mine.json")
        const data = await response.json
        if (data && data.collection) {
          setCourses(data.collection)
        }
      } catch (error) {
        console.error("Error fetching courses:", error)
      }
    }
    fetchCourses()
  }, [])

  const filteredCourses = courses.filter((course) => course.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-background">

      <main className="px-4 py-6 md:px-6 md:py-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{I18n.t("courses.admin_page.courses")}</h1>
              <p className="text-muted-foreground">{I18n.t("courses.admin_page.manage_courses")}</p>
            </div>
            <Button asChild>
              <Link to="/courses/new">
                <Plus className="h-4 w-4 mr-2" />
                {I18n.t("courses.admin_page.create_course")}
              </Link>
            </Button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-1/3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={I18n.t("courses.admin_page.search_courses")}
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{I18n.t("courses.admin_page.table_course")}</TableHead>
                  <TableHead>{I18n.t("courses.admin_page.table_category")}</TableHead>
                  <TableHead>{I18n.t("courses.admin_page.table_level")}</TableHead>
                  <TableHead className="hidden md:table-cell">{I18n.t("courses.admin_page.table_students")}</TableHead>
                  <TableHead className="hidden md:table-cell">{I18n.t("courses.admin_page.table_last_updated")}</TableHead>
                  <TableHead>{I18n.t("courses.admin_page.table_status")}</TableHead>
                  <TableHead className="text-right">{I18n.t("courses.admin_page.table_actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.slug}>
                    <TableCell className="font-medium">{course.title}</TableCell>
                    <TableCell>{course.category}</TableCell>
                    <TableCell>{course.level}</TableCell>
                    <TableCell className="hidden md:table-cell">{course.students}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(course.updated_at)}</TableCell>
                    <TableCell>
                      <Badge variant={course.published ? "default" : "secondary"}>
                        {course.published ? I18n.t("courses.admin_page.published") : I18n.t("courses.admin_page.draft")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">{I18n.t("courses.admin_page.open_menu")}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{I18n.t("courses.admin_page.actions")}</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link to={`/courses/${course.slug}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              {I18n.t("courses.admin_page.edit")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/courses/${course.slug}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              {I18n.t("courses.admin_page.preview")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            {I18n.t("courses.admin_page.duplicate")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            {I18n.t("courses.admin_page.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  )
}
