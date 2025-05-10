"use client"

import React, { useState, useEffect } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Download,
  FileText,
  MessageSquare,
  List,
  X,
  Maximize,
  Volume2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
} from "lucide-react"
import VideoPlayer from "@/components/courses/videoPlayer"

import { get, post } from "@rails/request.js"

export default function LessonPage() {
  const { id, lesson_id } = useParams()
  const courseId = id
  const lessonId = lesson_id

  const [lesson, setLesson] = useState(null)
  const [module, setModule] = useState(null)
  const [enrollment, setEnrollment] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("content")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showFinishDialog, setShowFinishDialog] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchLesson()
  }, [courseId, lessonId])


  async function fetchLesson() {
    setLoading(true)
    setError(null)
    try {
      const response = await get(`/courses/${courseId}/lessons/${lessonId}.json`)
      if (response.ok) {
        const data = await response.json
        setLesson(data.lesson)
        setModule(data.course_module)
        if (data.enrollment) {
          setEnrollment(data.enrollment)
        } else {
          setEnrollment(null)
        }
      } else {
        setError("Failed to fetch lesson")
      }
    } catch (err) {
      setError("Failed to fetch lesson")
    } finally {
      setLoading(false)
    }
  }
  // Find next and previous lessons
  const findAdjacentLessons = () => {
    if (!module || !module.lessons) return { prev: null, next: null }

    const lessonsArr = module.lessons
    const idx = lessonsArr.findIndex((l) => String(l.id) === String(lessonId))

    return {
      prev: idx > 0 ? lessonsArr[idx - 1] : null,
      next: idx < lessonsArr.length - 1 ? lessonsArr[idx + 1] : null,
    }
  }

  const { prev, next } = findAdjacentLessons()

  const handleComplete = () => {
    // Navigate to next lesson if available
    if (next) {
      navigate(`/courses/${courseId}/lesson/${next.id}`)
    } else {
      navigate(`/courses/${courseId}`)
    }
  }

  const handleProgressUpdate = (newProgress) => {
    setProgress(newProgress)

    // Auto-mark as complete when reaching the end
    if (newProgress >= 98) {
      // In a real app, this would update the database
      console.log("Lesson completed automatically")
    }
  }

  // Format duration string to display time
  const formatDuration = (durationStr) => {
    // Extract minutes from string like "18 min"
    const minutes = Number.parseInt(durationStr.split(" ")[0], 10) || 0
    return `${minutes}:00`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading lesson...</p>
      </div>
    )
  }
  if (error || !lesson || !module) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error || "Lesson not found."}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className={`relative ${isFullscreen ? "fixed inset-0 z-50 bg-black" : ""}`}>
        <div
          className={`${isFullscreen ? "h-screen" : "aspect-video"} relative bg-black`}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => isPlaying && setShowControls(false)}
        >
          <VideoPlayer
            videoUrl={lesson.video_url}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            onProgressUpdate={handleProgressUpdate}
          />

          {/* Video Controls Overlay */}
          {/*showControls && (
            <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/70 to-transparent">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-white font-medium">{lesson.title}</h3>
                  <p className="text-white/70 text-sm">{module.title}</p>
                </div>
                {isFullscreen ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => setIsFullscreen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => setIsFullscreen(true)}
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-white text-xs">
                  <span>
                    {progress > 0
                      ? `${Math.floor((progress * Number.parseInt(lesson.duration, 10)) / 100)}:${Math.floor(
                        (((progress * Number.parseInt(lesson.duration, 10)) / 100) % 1) * 60,
                      )
                        .toString()
                        .padStart(2, "0")}`
                      : "0:00"}
                  </span>
                  <span>{formatDuration(lesson.duration)}</span>
                </div>
                <Progress value={progress} className="h-1" />

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      disabled={!prev}
                      onClick={() => prev && router.push(`/courses/${courseId}/lesson/${prev.id}`)}
                    >
                      <SkipBack className="h-5 w-5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 h-12 w-12"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      disabled={!next}
                      onClick={() => next && router.push(`/courses/${courseId}/lesson/${next.id}`)}
                    >
                      <SkipForward className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                      <Volume2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )*/}
        </div>
      </div>

      {!isFullscreen && (
        <div className="px-4 py-6 md:px-6 md:py-8">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="sm" asChild className="mr-4">
              <Link to={`/courses/${courseId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Course
              </Link>
            </Button>
            <div className="flex-1">
              <div className="flex items-center">
                <h1 className="text-xl font-bold">{lesson.title}</h1>
                {lesson.completed && <CheckCircle className="h-5 w-5 text-green-500 ml-2" />}
              </div>
              <p className="text-sm text-muted-foreground">{module.title}</p>
            </div>
            <div className="flex items-center gap-2">
              {enrollment ? (() => {
                const started = enrollment.started_lessons?.includes(lesson.id)
                const finished = enrollment.finished_lessons?.includes(lesson.id)
                if (finished) {
                  return (
                    <Button variant="outline" size="sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Completed
                    </Button>
                  )
                } else if (started) {
                  return (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await post(`/course_enrollments/${enrollment.id}/finish_lesson`, {
                            body: JSON.stringify({ lesson_id: lesson.id })
                          })
                          // Refetch lesson data to update UI
                          await fetchLesson()
                          setShowFinishDialog(true)
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Finish Lesson
                      </Button>
                      <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>🎉 Lesson Completed!</DialogTitle>
                          </DialogHeader>
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="flex flex-col items-center justify-center py-4"
                          >
                            <CheckCircle className="h-16 w-16 text-green-500 mb-4 animate-bounce" />
                            <h2 className="text-xl font-bold mb-2">Congratulations!</h2>
                            <p className="text-muted-foreground mb-4">You've finished this lesson. Keep going!</p>
                          </motion.div>
                          <DialogFooter>
                            <Button onClick={() => setShowFinishDialog(false)}>Close</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </>
                  )
                } else {
                  return (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await post(`/course_enrollments/${enrollment.id}/start_lesson`, {
                          body: JSON.stringify({ lesson_id: lesson.id })
                        })
                        fetchLesson()
                      }}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Lesson
                    </Button>
                  )
                }
              })() : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (enrollment) {
                      await post(`/course_enrollments/${enrollment.id}/finish_lesson`, {
                        body: JSON.stringify({ lesson_id: lesson.id })
                      })


                      // Refetch lesson data to update UI
                      fetchLesson()
                      // handleComplete()
                    }
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Complete
                </Button>
              )}
              {next && (
                <Button size="sm" asChild>
                  <Link to={`/courses/${courseId}/lessons/${next.id}`}>
                    Next Lesson
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Tabs defaultValue="content" className="mb-6" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="resources">Resources</TabsTrigger>
                  <TabsTrigger value="discussion">Discussion</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="mt-4">
                  <div className="prose max-w-none">
                    <h2 className="text-xl text-default font-semibold mb-4">About this lesson</h2>
                    <p className="text-muted-foreground">{lesson.description}</p>

                    <div className="mt-6">
                      <h3 className="text-lg text-default font-medium mb-3">What you'll learn</h3>
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                          <span>Key concepts covered in this lesson</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                          <span>Practical skills you'll develop</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                          <span>How this connects to other lessons</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="resources" className="mt-4">
                  {lesson.resources && lesson.resources.length > 0 ? (
                    <div className="space-y-4">
                      {lesson.resources.map((resource) => (
                        <div key={resource.id} className="flex items-center p-3 rounded-md border">
                          <FileText className="h-5 w-5 mr-3 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="font-medium">{resource.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {resource.fileType.toUpperCase()}, {resource.fileSize}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No resources available for this lesson.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="discussion" className="mt-4">
                  <div className="flex items-center justify-center p-8 text-center">
                    <div>
                      <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <h3 className="font-medium text-lg mb-1">Join the discussion</h3>
                      <p className="text-muted-foreground mb-4">
                        Ask questions and share your thoughts about this lesson.
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
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Module Lessons</h3>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/courses/${courseId}`}>
                          <List className="h-4 w-4 mr-2" />
                          All Modules
                        </Link>
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {module.lessons.map((moduleLesson) => (
                        <Link
                          key={moduleLesson.id}
                          to={`/courses/${courseId}/lessons/${moduleLesson.id}`}>
                          <div
                            className={`flex items-center p-2 rounded-md ${moduleLesson.id === lessonId
                              ? "bg-primary/10 border border-primary/20"
                              : moduleLesson.completed
                                ? "bg-muted/50"
                                : "hover:bg-muted/30"
                              }`}
                          >
                            <div className="mr-3">
                              {moduleLesson.completed ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : moduleLesson.id === lessonId ? (
                                <Play className="h-5 w-5 text-primary" />
                              ) : (
                                <Play className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`font-medium truncate ${moduleLesson.id === lessonId ? "text-primary" : ""}`}
                              >
                                {moduleLesson.title}
                              </p>
                              <div className="flex items-center text-xs text-muted-foreground mt-1">
                                <span>{moduleLesson.duration}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    <div className="flex justify-between items-center">
                      <Button variant="outline" size="sm" disabled={!prev} asChild={!!prev}>
                        {prev ? (
                          <Link to={`/courses/${courseId}/lessons/${prev.id}`}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Previous
                          </Link>
                        ) : (
                          <>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Previous
                          </>
                        )}
                      </Button>

                      <Button variant="outline" size="sm" disabled={!next} asChild={!!next}>
                        {next ? (
                          <Link to={`/courses/${courseId}/lessons/${next.id}`}>
                            Next
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Link>
                        ) : (
                          <>
                            Next
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
