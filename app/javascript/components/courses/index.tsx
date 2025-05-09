"use client"
import React, { useState } from "react"
import { Link } from "react-router-dom"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Award } from "lucide-react"

export default function CourseList() {
  const [activeTab, setActiveTab] = useState("all")
  const {
    items: courses,
    loading,
    lastElementRef,
    error,
  } = useInfiniteScroll("/courses.json")

  const filteredCourses =
    activeTab === "all"
      ? courses
      : activeTab === "in-progress"
        ? courses.filter((course) => course.progress > 0 && course.progress < 100)
        : courses.filter((course) => course.progress === 100)

  if (loading && courses.length === 0) {
    return <div className="p-8 text-center">Loading courses...</div>
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>
  }

  return (
    <div className="mx-auto p-4">
      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setActiveTab("all")}>
            All Courses
          </TabsTrigger>
          <TabsTrigger value="in-progress" onClick={() => setActiveTab("in-progress")}>
            In Progress
          </TabsTrigger>
          <TabsTrigger value="completed" onClick={() => setActiveTab("completed")}>
            Completed
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course, idx) => (
            <Link
              to={`/courses/${course.id}`}
              key={course.id}
              className="group"
              ref={idx === filteredCourses.length - 1 ? lastElementRef : null}
            >
              <Card className="overflow-hidden transition-all hover:shadow-md">
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={course.thumbnail_url || "/placeholder.svg"}
                    alt={course.title}
                    className="object-cover w-full h-full transition-transform group-hover:scale-105"
                  />
                  <Badge className="absolute top-2 right-2">{course.level}</Badge>
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <Badge variant="outline" className="px-2 py-0 text-xs">
                      {course.category}
                    </Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      {course.duration}
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">Instructor: {course.instructor}</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{course.progress}% complete</span>
                      <span className="text-muted-foreground">{course.lastAccessed}</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between">
                  <div className="text-sm text-muted-foreground">
                    {course.progress < 100 ? "Continue learning" : "Review course"}
                  </div>
                  {course.progress === 100 && <Award className="h-4 w-4 text-yellow-500" />}
                </CardFooter>
              </Card>
            </Link>
          ))
        ) : (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-medium text-default">No courses</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by creating a new course.
            </p>
          </div>
        )}
      </div>
      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}
    </div>
  )
}
