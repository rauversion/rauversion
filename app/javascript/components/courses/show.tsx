"use client"
import React, { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
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
import { ShareDialog } from "@/components/ui/share-dialog"
import { ShowMoreText } from "@/components/ui/show_more"
import { get, post } from "@rails/request.js"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import CourseEnrollmentForm from "@/components/courses/CourseEnrollmentForm"
import useAuthStore from '@/stores/authStore'

export default function CoursePage() {
  const params = useParams()
  const courseId = params.id
  const [course, setCourse] = useState<any>(null)
  const [enrollment, setEnrollment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("content")
  const [modules, setModules] = useState<any[]>([])
  const [modulesLoading, setModulesLoading] = useState(true)
  const [modulesError, setModulesError] = useState<string | null>(null)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [documents, setDocuments] = useState<any[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const { currentUser } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchCourse() {
      setLoading(true)
      setError(null)
      try {
        const response = await get(`/courses/${courseId}.json?get_enrollment=true`)
        if (response.ok) {
          const data = await response.json
          setCourse(data.course)
          if (data.enrollment) {
            setEnrollment(data.enrollment)
          } else {
            setEnrollment(null)
          }
        } else {
          setError("Failed to fetch course")
        }
      } catch (err) {
        setError("Failed to fetch course")
      } finally {
        setLoading(false)
      }
    }
    fetchCourse()
  }, [courseId])

  useEffect(() => {
    async function fetchModules() {
      setModulesLoading(true)
      setModulesError(null)
      try {
        const response = await get(`/courses/${courseId}/course_modules.json`)
        if (response.ok) {
          const data = await response.json
          setModules(data.course_modules)
        } else {
          setModulesError("Failed to fetch modules")
        }
      } catch (err) {
        setModulesError("Failed to fetch modules")
      } finally {
        setModulesLoading(false)
      }
    }
    fetchModules()
  }, [courseId])

  // Fetch course documents when resources tab is selected
  useEffect(() => {
    if (activeTab === "resources") {
      async function fetchDocuments() {
        setDocumentsLoading(true)
        try {
          const response = await get(`/courses/${courseId}/course_documents.json`)
          if (response.ok) {
            const data = await response.json
            setDocuments(data)
          } else {
            setDocuments([])
          }
        } catch {
          setDocuments([])
        } finally {
          setDocumentsLoading(false)
        }
      }
      fetchDocuments()
    }
  }, [activeTab, courseId])

  if (loading || modulesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-5 border-b bg-background">
          <div className="flex h-16 items-center px-4 md:px-6">
            <Skeleton className="h-8 w-40 mr-4" />
            <Skeleton className="h-6 w-1/3 flex-1" />
            <div className="flex items-center gap-2 ml-auto">
              <Skeleton className="h-8 w-20 rounded" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </header>
        <div className="px-4 py-6 md:px-6 md:py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Skeleton className="aspect-video w-full mb-6" />
              <div className="mb-6">
                <Skeleton className="h-6 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/4 mb-4" />
                <div className="flex items-center gap-3 mb-6">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-2 w-full" />
              </div>
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="mb-4">
                    <Skeleton className="h-5 w-1/2 mb-2" />
                    <Skeleton className="h-3 w-1/3 mb-1" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Skeleton className="h-8 w-32 mb-4" />
                <Skeleton className="h-2 w-full mb-2" />
                <Skeleton className="h-2 w-3/4 mb-2" />
                <Skeleton className="h-2 w-1/2 mb-6" />
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-3 w-full" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  if (error || modulesError) {
    return <div className="container py-10 text-red-500">{error || modulesError}</div>
  }
  if (!course) {
    return <div className="container py-10">Course not found.</div>
  }

  // Progress and next lesson logic using enrollment if present
  let completedLessons = 0
  let totalLessons = 0
  let overallProgress = 0
  let nextLesson = null
  let moduleProgress: Record<string, any> = {}

  if (enrollment) {
    completedLessons = enrollment.completed_lessons?.length || 0
    totalLessons = (enrollment.completed_lessons?.length || 0) + (enrollment.remaining_lessons?.length || 0)
    overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
    nextLesson = enrollment.remaining_lessons?.find((l: any) => l && l.id) || null
    moduleProgress = enrollment.module_progress || {}
  } else {
    // fallback to old logic
    // Find the next incomplete lesson
    const findNextLesson = () => {
      for (const module of modules) {
        for (const lesson of module.lessons) {
          if (!lesson.completed) {
            return { moduleId: module.id, lessonId: lesson.id, title: lesson.title }
          }
        }
      }
      return null
    }
    nextLesson = findNextLesson()
    totalLessons = modules.reduce((acc, module) => acc + module.lessons.length, 0)
    completedLessons = modules.reduce(
      (acc, module) => acc + module.lessons.filter((lesson) => lesson.completed).length,
      0,
    )
    overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
    // Build moduleProgress fallback (per-module)
    moduleProgress = {}
    for (const module of modules) {
      const completed = module.lessons.filter((lesson: any) => lesson.completed).length
      const total = module.lessons.length
      moduleProgress[module.id] = {
        completed,
        total,
        percent: total > 0 ? Math.round((completed / total) * 100) : 0
      }
    }
  }

  // If enrollment is present, update each module's .progress with moduleProgress
  const modulesWithProgress = modules.map((module) => ({
    ...module,
    progress: moduleProgress[module.id]?.percent ?? 0,
  }));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-5 border-b bg-background">
        <div className="flex h-16 items-center px-4 md:px-6">
          <Link to="/courses" className="flex items-center mr-4">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="hidden sm:inline">{I18n.t("courses.show.back_to_courses")}</span>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold truncate">{course.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/courses/mine">
                <Settings className="h-4 w-4 mr-2" />
                {I18n.t("courses.show.admin")}
              </Link>
            </Button>
            {/*<Button variant="outline" size="icon" className="rounded-full">
              <Bookmark className="h-4 w-4" />
              <span className="sr-only">Bookmark</span>
            </Button>*/}
            <ShareDialog
              url={typeof window !== "undefined" ? window.location.href : ""}
              title={course?.title || ""}
              description={course?.description || ""}
            >
              <Button variant="outline" size="icon" className="rounded-full">
                <Share2 className="h-4 w-4" />
                <span className="sr-only">{I18n.t("courses.show.share")}</span>
              </Button>
            </ShareDialog>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 md:px-6 md:py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="aspect-video rounded-lg overflow-hidden mb-6">
              <img src={course.thumbnail_url || "/placeholder.svg"} alt={course.title} className="object-cover w-full h-full" />
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

              <ShowMoreText className="mb-4" text={course.description} maxHeight={100} />
              

              <div className="flex items-center gap-3 mb-6">
                <img
                  src={course.user.avatar_url.medium}
                  alt={course.user.name}
                  className="h-10 w-10 rounded-full"
                />
                <div>
                  <p className="font-medium">{course.user.name}</p>
                  <p className="text-sm text-muted-foreground">{course.user.username}</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{I18n.t("courses.show.overall_progress")}</span>
                  <span>{overallProgress}{I18n.t("courses.show.percent_complete")}</span>
                </div>
                <Progress value={overallProgress} className="h-2" />
              </div>

              {nextLesson && (
                <Card className="mb-6 bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">{I18n.t("courses.show.continue_where_left_off")}</h3>
                        <p className="font-medium">{nextLesson.title}</p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-blue-500 to-indigo-700 text-white shadow-lg hover:from-blue-600 hover:to-indigo-800 transition-all duration-200"
                        onClick={async (e) => {
                          e.preventDefault();
                          // Check for currentUser
                          if (!currentUser) {
                            setShowLoginDialog(true);
                            return;
                          }
                          if (enrollment && !enrollment.started_lessons?.includes(nextLesson.id)) {
                            await post(`/course_enrollments/${enrollment.id}/start_lesson`, {
                              body: JSON.stringify({ lesson_id: nextLesson.id }),
                            });
                          }
                          navigate(`/courses/${courseId}/lessons/${nextLesson.id}`);
                        }}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        {I18n.t("courses.show.continue_learning")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <Tabs defaultValue="content" className="mb-6" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">{I18n.t("courses.show.content")}</TabsTrigger>
                <TabsTrigger value="resources">{I18n.t("courses.show.resources")}</TabsTrigger>
                {/*<TabsTrigger value="discussion">Discussion</TabsTrigger>*/}
              </TabsList>
              <TabsContent value="content" className="mt-4">
                <Accordion type="multiple" className="w-full">
                  {modulesWithProgress.map((module) => (
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
                              {enrollment ? (() => {
                                const started = enrollment.started_lessons?.includes(lesson.id)
                                const finished = enrollment.finished_lessons?.includes(lesson.id)
                                if (finished) {
                                  return (
                                    <Button
                                      variant="success"
                                      size="lg"
                                      className="bg-gradient-to-r from-green-400 to-emerald-600 text-white shadow-lg hover:from-green-500 hover:to-emerald-700 transition-all duration-200"
                                    >
                                      <Link to={`/courses/${courseId}/lessons/${lesson.id}`} className="flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5" />
                                        {I18n.t("courses.show.review")}
                                      </Link>
                                    </Button>
                                  )
                                } else if (started) {
                                  return (
                                    <Button
                                      variant="primary"
                                      size="lg"
                                      className="bg-gradient-to-r from-blue-500 to-indigo-700 text-white shadow-lg hover:from-blue-600 hover:to-indigo-800 transition-all duration-200"
                                      onClick={async (e) => {
                                        e.preventDefault();
                                        if (!currentUser) {
                                          setShowLoginDialog(true);
                                          return;
                                        }
                                        navigate(`/courses/${courseId}/lessons/${lesson.id}`);
                                      }}
                                    >
                                      <span className="flex items-center gap-2">
                                        <Play className="h-5 w-5" />
                                        {I18n.t("courses.show.continue")}
                                      </span>
                                    </Button>
                                  )
                                } else {
                                  return (
                                    <Button
                                      variant="secondary"
                                      size="lg"
                                      className="bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white shadow-lg hover:from-pink-600 hover:to-fuchsia-700 transition-all duration-200"
                                      onClick={async (e) => {
                                        e.preventDefault();
                                        if (!currentUser) {
                                          setShowLoginDialog(true);
                                          return;
                                        }
                                        await post(`/course_enrollments/${enrollment.id}/start_lesson`, {
                                          body: JSON.stringify({ lesson_id: lesson.id })
                                        })
                                        navigate(`/courses/${courseId}/lessons/${lesson.id}`)
                                      }}
                                    >
                                      <span className="flex items-center gap-2">
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                        {I18n.t("courses.show.start")}
                                      </span>
                                    </Button>
                                  )
                                }
                              })() : (
                                <Button
                                  variant={lesson.completed ? "success" : "secondary"}
                                  size="lg"
                                  className={
                                    lesson.completed
                                      ? "bg-gradient-to-r from-green-400 to-emerald-600 text-white shadow-lg hover:from-green-500 hover:to-emerald-700 transition-all duration-200"
                                      : "bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white shadow-lg hover:from-pink-600 hover:to-fuchsia-700 transition-all duration-200"
                                  }
                                >
                                  <Link to={`/courses/${courseId}/lessons/${lesson.id}`} className="flex items-center gap-2">
                                    {lesson.completed ? (
                                      <CheckCircle className="h-5 w-5" />
                                    ) : (
                                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                                      </svg>
                                    )}
                                    {lesson.completed ? I18n.t("courses.show.review") : I18n.t("courses.show.start")}
                                  </Link>
                                </Button>
                              )}
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
                  {documentsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading resources...</div>
                  ) : documents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No resources added yet.</p>
                    </div>
                  ) : (
                    documents.map((doc) => (
                      <div key={doc.id} className="flex items-center p-3 rounded-md border">
                        <FileText className="h-5 w-5 mr-3 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{doc.title}</p>
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <span>{doc.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {enrollment ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/courses/${courseId}/course_documents/${doc.id}/download`)
                                  if (response.ok) {
                                    const data = await response.json()
                                    if (data.url) {
                                      window.open(data.url, "_blank", "noopener")
                                    }
                                  }
                                } catch (e) {
                                  // Optionally show error toast
                                }
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              {I18n.t("courses.show.download")}
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" disabled>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
              <TabsContent value="discussion" className="mt-4">
                <div className="flex items-center justify-center p-8 text-center">
                  <div>
                    <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-medium text-lg mb-1">{I18n.t("courses.show.join_discussion")}</h3>
                    <p className="text-muted-foreground mb-4">
                      {I18n.t("courses.show.connect_with_students")}
                    </p>
                    <Button>{I18n.t("courses.show.start_conversation")}</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-4">{I18n.t("courses.show.your_progress")}</h3>
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{I18n.t("courses.show.overall_completion")}</span>
                      <span className="font-medium">{overallProgress}%</span>
                    </div>
                    <Progress value={overallProgress} className="h-2" />
                  </div>

                  <div className="space-y-4">
                    {modulesWithProgress.map((module) => (
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
                        <p className="font-medium">{I18n.t("courses.show.course_stats")}</p>
                      </div>
                      {!enrollment ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="lg"
                              className="ml-2 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white shadow-lg hover:from-pink-600 hover:to-yellow-600 transition-all duration-200 animate-pulse"
                              style={{
                                fontWeight: 700,
                                letterSpacing: "0.03em",
                                borderRadius: "9999px",
                                paddingLeft: "2rem",
                                paddingRight: "2rem",
                                fontSize: "1.1rem"
                              }}
                              onClick={e => {
                                if (!currentUser) {
                                  e.preventDefault();
                                  setShowLoginDialog(true);
                                }
                              }}
                            >
                              <span role="img" aria-label="sparkles" className="mr-2">✨</span>
                              {I18n.t("courses.show.enroll_now")}
                              <span role="img" aria-label="arrow" className="ml-2">➡️</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{I18n.t("courses.show.enroll_in", { title: course.title })}</DialogTitle>
                            </DialogHeader>
                            <CourseEnrollmentForm
                              courseId={courseId}
                              courseProduct={course.course_product}
                              enrollmentType={course.enrollment_type}
                            />
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <span className="ml-2 px-4 py-2 rounded-full bg-green-100 text-green-700 font-semibold shadow-inner border border-green-200">
                          <CheckCircle className="inline-block h-5 w-5 mr-1 text-green-500" />
                          {I18n.t("courses.show.already_enrolled")}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-md">
                        <p className="text-2xl font-bold">{completedLessons}</p>
                        <p className="text-sm text-muted-foreground">{I18n.t("courses.show.lessons_completed")}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-md">
                        <p className="text-2xl font-bold">{totalLessons - completedLessons}</p>
                        <p className="text-sm text-muted-foreground">{I18n.t("courses.show.lessons_remaining")}</p>
                      </div>
                    </div>
                  </div>

                  {/*nextLesson && (
                    <div className="mt-6">
                      <Button className="w-full">
                        <Play className="mr-2 h-4 w-4" />
                        Continue Learning
                      </Button>
                    </div>
                  )*/}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>


      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="mb-4 text-lg">You need to be logged in to access this feature.</p>
            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-700 text-white shadow-lg hover:from-blue-600 hover:to-indigo-800 transition-all duration-200"
              onClick={() => {
                window.location.href = "/users/sign_in"
              }}
            >
              Go to Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )

}
