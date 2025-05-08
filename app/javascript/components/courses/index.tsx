"use client"
import React from "react"
import { useState } from "react"
import {Link} from "react-router-dom"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Award } from "lucide-react"

// Mock data for courses
const courses = [
  {
    id: 1,
    title: "Guitar Fundamentals",
    instructor: "John Smith",
    image: "/placeholder.svg?height=200&width=300",
    progress: 75,
    category: "Instruments",
    duration: "12 hours",
    level: "Beginner",
    lastAccessed: "2 days ago",
  },
  {
    id: 2,
    title: "Piano Masterclass",
    instructor: "Sarah Johnson",
    image: "/placeholder.svg?height=200&width=300",
    progress: 45,
    category: "Instruments",
    duration: "15 hours",
    level: "Intermediate",
    lastAccessed: "Yesterday",
  },
  {
    id: 3,
    title: "Music Theory 101",
    instructor: "David Williams",
    image: "/placeholder.svg?height=200&width=300",
    progress: 90,
    category: "Theory",
    duration: "8 hours",
    level: "Beginner",
    lastAccessed: "Just now",
  },
  {
    id: 4,
    title: "Vocal Training",
    instructor: "Maria Garcia",
    image: "/placeholder.svg?height=200&width=300",
    progress: 30,
    category: "Vocals",
    duration: "10 hours",
    level: "All levels",
    lastAccessed: "3 days ago",
  },
  {
    id: 5,
    title: "Songwriting Workshop",
    instructor: "Alex Turner",
    image: "/placeholder.svg?height=200&width=300",
    progress: 60,
    category: "Composition",
    duration: "6 hours",
    level: "Intermediate",
    lastAccessed: "1 week ago",
  },
  {
    id: 6,
    title: "Drum Basics",
    instructor: "Mike Johnson",
    image: "/placeholder.svg?height=200&width=300",
    progress: 15,
    category: "Instruments",
    duration: "9 hours",
    level: "Beginner",
    lastAccessed: "5 days ago",
  },
]

export default function CourseList() {
  const [activeTab, setActiveTab] = useState("all")

  const filteredCourses =
    activeTab === "all"
      ? courses
      : activeTab === "in-progress"
        ? courses.filter((course) => course.progress > 0 && course.progress < 100)
        : courses.filter((course) => course.progress === 100)

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
        {filteredCourses.map((course) => (
          <Link to={`/courses/${course.id}`} key={course.id} className="group">
            <Card className="overflow-hidden transition-all hover:shadow-md">
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={course.image || "/placeholder.svg"}
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
        ))}
      </div>
    </div>
  )
}
