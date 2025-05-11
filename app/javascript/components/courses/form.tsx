import React, { useState } from "react"
import { Link , useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, Eye, Settings, FileText, LayoutGrid, Upload, Users } from "lucide-react"
import CourseDetailsForm from "@/components/courses/admin/course-details-form"
import ModulesManager from "@/components/courses/admin/modules-manager"
import ResourcesManager from "@/components/courses/admin/resources-manager"
import CourseSettings from "@/components/courses/admin/course-settings"
import CourseEnrollmentsTab from "@/components/courses/CourseEnrollmentsTab"
import { post, put, destroy, get } from "@rails/request.js"
import { useToast } from '@/hooks/use-toast'

export default function NewCoursePage() {
  const [activeTab, setActiveTab] = useState("details")
  const { id } = useParams()
  const courseId = id
  const navigate = useNavigate()
  interface CourseData {
    id: number | null
    title: string
    description: string
    category: string
    level: string
    duration: string
    price: string
    instructor: string
    instructor_title: string
    published: boolean
    modules: any[]
    resources: any[]
  }

  const { toast } = useToast()

  const [courseData, setCourseData] = useState<CourseData>({
    id: null,
    title: "",
    description: "",
    category: "",
    level: "beginner",
    duration: "",
    price: "",
    instructor: "",
    instructor_title: "",
    published: false,
    modules: [],
    resources: [],
  })

  React.useEffect(() => {
    const fetchCourse = async () => {
      try {
        if (courseId) {
          const response = await fetch(`/courses/${courseId}.json`)
          if (response.ok) {
            const data = await response.json()
            setCourseData((prev) => ({ ...prev, ...data.course }))
          } else {
            console.error("Failed to fetch course details")
          }
        }
      } catch (error) {
        console.error("Error fetching course details:", error)
      }
    }
    fetchCourse()
  }, [])

  // Load modules when modules tab is selected
  const fetchModules = async () => {
    if (courseId) {
      try {
        const response = await get(`/courses/${courseId}/course_modules.json`);
        const data = await response.json;
        if (data && data.course_modules) {
          setCourseData((prev) => ({ ...prev, modules: data.course_modules as any[] }))
        }
      } catch (error) {
        console.error("Error fetching course modules:", error)
      }
    }
  }

  React.useEffect(() => {
    if (activeTab === "modules") {
      fetchModules()
    }
  }, [activeTab, courseId])

  // Use a more controlled approach to update state
  interface CourseData {
    id: number | null
    title: string
    description: string
    category: string
    level: string
    duration: string
    price: string
    instructor: string
    instructor_title: string
    published: boolean
    modules: any[]
    resources: any[]
  }

  const handleCourseDataChange = (data: Partial<CourseData>) => {
    // Only update if data actually changed to prevent unnecessary renders
    setCourseData((prev) => {
      // Check if the new data is different from the current data
      const hasChanged = Object.keys(data).some((key) => (prev as any)[key] !== (data as any)[key])
      if (!hasChanged) return prev // Return previous state if nothing changed
      return { ...prev, ...data }
    })
  }

  const syncModulesWithBackend = async (updatedModules: CourseData["modules"]) => {
    if (!courseId) {
      console.warn("Cannot sync modules without course id")
      return
    }

    // Find new modules (id is temporary, e.g., number > some large value)
    const newModules = updatedModules.filter((m) => typeof m.id === "number" && m.id > 1000000000000)
    // Find deleted modules by comparing with current state
    const deletedModules = courseData.modules.filter((m) => !updatedModules.some((um) => um.id === m.id))

    // Create new modules
    for (const module of newModules) {
      try {
        const response = await post(`/courses/${courseId}.json`, {
          body: JSON.stringify({ course: { course_module_attributes: updatedModules } }),
        })
        if (response.ok) {
          const data = await response.json()
          // Replace temporary id with real id
          setCourseData((prev) => {
            const modules = prev.modules.map((mod) => (mod.id === module.id ? data.course_module : mod))
            return { ...prev, modules }
          })
        }
      } catch (error) {
        console.error("Failed to create module:", error)
      }
    }

    // Delete removed modules
    for (const module of deletedModules) {
      try {
        const response = await destroy(`/courses/${courseId}/course_modules/${module.id}.json`)
        if (!response.ok) {
          console.error("Failed to delete module:", module.id)
        }
      } catch (error) {
        console.error("Failed to delete module:", error)
      }
    }
  }

  const handleSaveCourse = async () => {
    try {
      let response
      if (courseId) {
        response = await put(`/courses/${courseId}.json`, { body: JSON.stringify({ course: courseData }) })
      } else {
        response = await post("/courses.json", { body: JSON.stringify({ course: courseData }) })
      }
      const data = await response.json

      setCourseData((prev) => ({ ...prev, ...data.course }))

      toast({
        title: "Course saved successfully!"
      })

      if (data.course.id) {
        // Navigate to edit page for the newly created course
        navigate(`/courses/${data.course.slug}/edit`)
      }
      // router.push("/admin/courses")
    } catch (error) {
      console.error("Failed to save course:", error)
      toast({
        title: "Failed to save course. Please try again."
      })
    }
  }

  const handlePublishCourse = () => {
    setCourseData((prev) => ({ ...prev, published: true }))
    // In a real app, this would publish the course
    toast({
      title: "Course published successfully!"
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-5 border-b bg-background">
        <div className="flex h-16 items-center px-4 md:px-6">
          <Link to="/courses/mine" className="flex items-center mr-4">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="hidden sm:inline">{I18n.t("courses.form.back_to_courses")}</span>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold truncate">{courseData.title || I18n.t("courses.form.new_course")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/courses/${courseId}`} target="_blank">
                <Eye className="h-4 w-4 mr-2" />
                {I18n.t("courses.form.preview")}
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleSaveCourse}>
              <Save className="h-4 w-4 mr-2" />
              {I18n.t("courses.form.save_draft")}
            </Button>
            <Button size="sm" onClick={handlePublishCourse}>
              {I18n.t("courses.form.publish")}
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 md:px-6 md:py-8">
        <Tabs defaultValue="details" className="space-y-4" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details">
              <FileText className="h-4 w-4 mr-2" />
              Course Details
            </TabsTrigger>
            <TabsTrigger value="modules">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Modules & Lessons
            </TabsTrigger>
            <TabsTrigger value="resources">
              <Upload className="h-4 w-4 mr-2" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="enrollments">
              <Users className="h-4 w-4 mr-2" />
              Enrollments
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardContent className="pt-6">
                <CourseDetailsForm courseData={courseData} onDataChange={handleCourseDataChange} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modules">
            <ModulesManager
              courseId={courseId}
              modules={courseData.modules as any[]}
              onModuleCreate={async (module) => {
                if (!courseId) return
                await post(`/courses/${courseId}/course_modules.json`, {
                  body: JSON.stringify({ course_module: module }),
                })
                await fetchModules()
              }}
              refreshModules={fetchModules}
              onModuleUpdate={async (moduleId, updatedModule) => {
                if (!courseId) return
                await put(`/courses/${courseId}/course_modules/${moduleId}.json`, {
                  body: JSON.stringify({ course_module: updatedModule }),
                })
                await fetchModules()
              }}
              onModuleDelete={async (moduleId) => {
                if (!courseId) return
                await destroy(`/courses/${courseId}/course_modules/${moduleId}.json`)
                await fetchModules()
              }}
              onLessonCreate={async (moduleId, lesson) => {
                await post(`/courses/${courseId}/course_modules/${moduleId}/lessons.json`, {
                  body: JSON.stringify({ lesson }),
                })
                await fetchModules()
              }}
              onLessonUpdate={async (moduleId, lessonId, updatedLesson) => {
                await put(`/courses/${courseId}/course_modules/${moduleId}/lessons/${lessonId}.json`, {
                  body: JSON.stringify({ lesson: updatedLesson }),
                })
                await fetchModules()
              }}
              onLessonDelete={async (moduleId, lessonId) => {
                await destroy(`/courses/${courseId}/course_modules/${moduleId}/lessons/${lessonId}.json`)
                await fetchModules()
              }}
              onLessonDocumentCreate={async (moduleId, doc, lessonId) => {
                // lessonId may be undefined for new lessons
                if (!lessonId) return
                await post(`/courses/${courseId}/course_modules/${moduleId}/lessons/${lessonId}/course_documents.json`, {
                  body: JSON.stringify({ course_document: doc }),
                })
                await fetchModules()
              }}
              onLessonDocumentDelete={async (moduleId, docId, lessonId) => {
                if (!lessonId || !docId) return
                await destroy(`/courses/${courseId}/course_modules/${moduleId}/lessons/${lessonId}/course_documents/${docId}.json`)
                await fetchModules()
              }}
            />
          </TabsContent>


          <TabsContent value="resources">
            <ResourcesManager
              courseId={courseId}
              resources={courseData.resources as any[]}
              onResourcesChange={(resources: any[]) => handleCourseDataChange({ resources })}
            />
          </TabsContent>

          <TabsContent value="enrollments">
            <CourseEnrollmentsTab />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardContent className="pt-6">
                <CourseSettings
                  courseData={courseData}
                  onDataChange={handleCourseDataChange}
                  onSave={async (settings) => {
                    if (!courseId) return
                    const response = await put(`/courses/${courseId}.json`, {
                      body: JSON.stringify({ course: settings }),
                    })

                    if(!response.ok) {
                      // const response = await get(`/courses/${courseId}.json`)
                      // const data = await response.json
                      // setCourseData((prev) => ({ ...prev, ...data.course }))
                      toast({
                        title: "updated course settings successfully!"
                      })
                    } else {
                      toast({
                        title: "error updating course settings"
                      })
                    }
                    // Optionally refresh course data
                    // const response = await get(`/courses/${courseId}.json`)
                    // const data = await response.json
                    // setCourseData((prev) => ({ ...prev, ...data.course }))
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
