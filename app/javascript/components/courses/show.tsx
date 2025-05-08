"use client"
import React from "react"
import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowLeft,
  Play,
  CheckCircle,
  Clock,
  Download,
  Share2,
  Bookmark,
  Music2,
  FileText,
  Video,
  MessageSquare,
  Settings,
} from "lucide-react"

// Mock course data
const coursesData = [
  {
    id: 1,
    title: "Guitar Fundamentals",
    instructor: "John Smith",
    instructorTitle: "Professional Guitarist & Music Teacher",
    instructorImage: "/placeholder.svg?height=100&width=100",
    image: "/placeholder.svg?height=400&width=800",
    progress: 75,
    category: "Instruments",
    duration: "12 hours",
    level: "Beginner",
    description:
      "Master the basics of guitar playing with this comprehensive course designed for beginners. Learn chords, strumming patterns, and essential techniques to start playing your favorite songs.",
    lastAccessed: "2 days ago",
    modules: [
      {
        id: 1,
        title: "Getting Started with Guitar",
        progress: 100,
        lessons: [
          { id: 1, title: "Introduction to the Course", duration: "5 min", completed: true, type: "video" },
          { id: 2, title: "Parts of the Guitar", duration: "10 min", completed: true, type: "video" },
          { id: 3, title: "Proper Posture and Hand Position", duration: "15 min", completed: true, type: "video" },
          { id: 4, title: "Tuning Your Guitar", duration: "12 min", completed: true, type: "video" },
        ],
      },
      {
        id: 2,
        title: "Basic Chords and Strumming",
        progress: 75,
        lessons: [
          { id: 5, title: "E Minor and A Minor Chords", duration: "18 min", completed: true, type: "video" },
          { id: 6, title: "D Major and G Major Chords", duration: "20 min", completed: true, type: "video" },
          { id: 7, title: "C Major and Basic Chord Transitions", duration: "25 min", completed: true, type: "video" },
          { id: 8, title: "Basic Strumming Patterns", duration: "15 min", completed: false, type: "video" },
        ],
      },
      {
        id: 3,
        title: "Your First Songs",
        progress: 50,
        lessons: [
          { id: 9, title: "Simple Two-Chord Songs", duration: "22 min", completed: true, type: "video" },
          { id: 10, title: "Three-Chord Progressions", duration: "25 min", completed: true, type: "video" },
          {
            id: 11,
            title: "Practice Session: 'Horse With No Name'",
            duration: "30 min",
            completed: false,
            type: "practice",
          },
          {
            id: 12,
            title: "Practice Session: 'Knockin' on Heaven's Door'",
            duration: "35 min",
            completed: false,
            type: "practice",
          },
        ],
      },
      {
        id: 4,
        title: "Fingerpicking Basics",
        progress: 0,
        lessons: [
          { id: 13, title: "Introduction to Fingerpicking", duration: "15 min", completed: false, type: "video" },
          { id: 14, title: "Basic Fingerpicking Patterns", duration: "20 min", completed: false, type: "video" },
          { id: 15, title: "Simple Fingerpicking Songs", duration: "25 min", completed: false, type: "video" },
          { id: 16, title: "Practice Session: Fingerpicking", duration: "30 min", completed: false, type: "practice" },
        ],
      },
    ],
  },
  // Other courses would be defined here
]

export default function CoursePage() {
  const params = useParams()
  const courseId = Number(params.id)
  const [course, setCourse] = useState(null)
  const [activeTab, setActiveTab] = useState("content")

  useEffect(() => {
    // In a real app, this would be an API call
    const foundCourse = coursesData.find((c) => c.id === courseId)
    setCourse(foundCourse)
  }, [courseId])

  if (!course) {
    return <div className="container py-10">Loading course...</div>
  }

  // Find the next incomplete lesson
  const findNextLesson = () => {
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (!lesson.completed) {
          return { moduleId: module.id, lessonId: lesson.id, title: lesson.title }
        }
      }
    }
    return null
  }

  const nextLesson = findNextLesson()

  // Calculate overall progress
  const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0)
  const completedLessons = course.modules.reduce(
    (acc, module) => acc + module.lessons.filter((lesson) => lesson.completed).length,
    0,
  )
  const overallProgress = Math.round((completedLessons / totalLessons) * 100)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="flex h-16 items-center px-4 md:px-6">
          <Link to="/courses" className="flex items-center mr-4">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="hidden sm:inline">Back to Courses</span>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold truncate">{course.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/courses/mine">
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </Link>
            </Button>
            <Button variant="outline" size="icon" className="rounded-full">
              <Bookmark className="h-4 w-4" />
              <span className="sr-only">Bookmark</span>
            </Button>
            <Button variant="outline" size="icon" className="rounded-full">
              <Share2 className="h-4 w-4" />
              <span className="sr-only">Share</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 md:px-6 md:py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="aspect-video rounded-lg overflow-hidden mb-6">
              <img src={course.image || "/placeholder.svg"} alt={course.title} className="object-cover w-full h-full" />
            </div>

            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="outline">{course.category}</Badge>
                <Badge variant="outline">{course.level}</Badge>
                <div className="flex items-center text-sm text-muted-foreground ml-auto">
                  <Clock className="mr-1 h-3 w-3" />
                  {course.duration}
                </div>
              </div>

              <h1 className="text-2xl font-bold mb-2 md:text-3xl">{course.title}</h1>
              <p className="text-muted-foreground mb-4">{course.description}</p>

              <div className="flex items-center gap-3 mb-6">
                <img
                  src={course.instructorImage || "/placeholder.svg"}
                  alt={course.instructor}
                  className="h-10 w-10 rounded-full"
                />
                <div>
                  <p className="font-medium">{course.instructor}</p>
                  <p className="text-sm text-muted-foreground">{course.instructorTitle}</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Overall Progress</span>
                  <span>{overallProgress}% complete</span>
                </div>
                <Progress value={overallProgress} className="h-2" />
              </div>

              {nextLesson && (
                <Card className="mb-6 bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Continue where you left off</h3>
                        <p className="font-medium">{nextLesson.title}</p>
                      </div>
                      <Button size="sm">
                        <Play className="mr-2 h-4 w-4" />
                        Continue
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <Tabs defaultValue="content" className="mb-6" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="discussion">Discussion</TabsTrigger>
              </TabsList>
              <TabsContent value="content" className="mt-4">
                <Accordion type="multiple" className="w-full">
                  {course.modules.map((module) => (
                    <AccordionItem value={`module-${module.id}`} key={module.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex flex-1 items-center justify-between pr-4">
                          <div>
                            <h3 className="font-medium text-left">{module.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress value={module.progress} className="h-1.5 w-24" />
                              <span className="text-xs text-muted-foreground">{module.progress}% complete</span>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 mt-2">
                          {module.lessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className={`flex items-center p-2 rounded-md ${lesson.completed ? "bg-muted/50" : "hover:bg-muted/30"}`}
                            >
                              <div className="mr-3">
                                {lesson.completed ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : lesson.type === "video" ? (
                                  <Video className="h-5 w-5 text-muted-foreground" />
                                ) : (
                                  <Music2 className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{lesson.title}</p>
                                <div className="flex items-center text-xs text-muted-foreground mt-1">
                                  <Clock className="mr-1 h-3 w-3" />
                                  {lesson.duration}
                                </div>
                              </div>
                              <Button variant="ghost" size="sm">
                                {lesson.completed ? "Review" : "Start"}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>
              <TabsContent value="resources" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center p-3 rounded-md border">
                    <FileText className="h-5 w-5 mr-3 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">Course Workbook</p>
                      <p className="text-sm text-muted-foreground">PDF, 2.4 MB</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  <div className="flex items-center p-3 rounded-md border">
                    <FileText className="h-5 w-5 mr-3 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">Chord Charts</p>
                      <p className="text-sm text-muted-foreground">PDF, 1.2 MB</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  <div className="flex items-center p-3 rounded-md border">
                    <Music2 className="h-5 w-5 mr-3 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">Practice Backing Tracks</p>
                      <p className="text-sm text-muted-foreground">ZIP, 45 MB</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="discussion" className="mt-4">
                <div className="flex items-center justify-center p-8 text-center">
                  <div>
                    <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-medium text-lg mb-1">Join the discussion</h3>
                    <p className="text-muted-foreground mb-4">
                      Connect with other students and ask questions about the course.
                    </p>
                    <Button>Start a conversation</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-4">Your Progress</h3>
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Overall completion</span>
                      <span className="font-medium">{overallProgress}%</span>
                    </div>
                    <Progress value={overallProgress} className="h-2" />
                  </div>

                  <div className="space-y-4">
                    {course.modules.map((module) => (
                      <div key={module.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="truncate pr-2">{module.title}</span>
                          <span className="font-medium">{module.progress}%</span>
                        </div>
                        <Progress value={module.progress} className="h-1.5" />
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-medium">Course Stats</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-md">
                        <p className="text-2xl font-bold">{completedLessons}</p>
                        <p className="text-sm text-muted-foreground">Lessons completed</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-md">
                        <p className="text-2xl font-bold">{totalLessons - completedLessons}</p>
                        <p className="text-sm text-muted-foreground">Lessons remaining</p>
                      </div>
                    </div>
                  </div>

                  {nextLesson && (
                    <div className="mt-6">
                      <Button className="w-full">
                        <Play className="mr-2 h-4 w-4" />
                        Continue Learning
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
