import React, { useState } from "react"
import { Link , useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, Eye, Settings, FileText, LayoutGrid, Upload } from "lucide-react"
import CourseDetailsForm from "@/components/courses/admin/course-details-form"
import ModulesManager from "@/components/courses/admin/modules-manager"
import ResourcesManager from "@/components/courses/admin/resources-manager"
import CourseSettings from "@/components/courses/admin/course-settings"
import { post, put, destroy, get } from "@rails/request.js"

export default function NewCoursePage() {
  const [activeTab, setActiveTab] = useState("details")

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
    is_published: boolean
    modules: any[]
    resources: any[]
  }

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
    is_published: false,
    modules: [],
    resources: [],
  })

  React.useEffect(() => {
    const fetchCourse = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const courseId = urlParams.get("id") || window.location.pathname.split("/")[2]
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
  React.useEffect(() => {
    const fetchModules = async () => {
      if (activeTab === "modules" && courseData.id) {
        try {
          const response = await get(`/courses/${courseData.id}/course_modules.json`);
          const data = await response.json;
          if (data && data.course_modules) {
            setCourseData((prev) => ({ ...prev, modules: data.course_modules as any[] }))
          }
        } catch (error) {
          console.error("Error fetching course modules:", error)
        }
      }
    }
    fetchModules()
  }, [activeTab, courseData.id])

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
    is_published: boolean
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
    if (!courseData.id) {
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
        const response = await post(`/courses/${courseData.id}.json`, {
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
        const response = await destroy(`/courses/${courseData.id}/course_modules/${module.id}.json`)
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
      if (courseData.id) {
        response = await put(`/courses/${courseData.id}.json`, { body: JSON.stringify({ course: courseData }) })
      } else {
        response = await post("/courses.json", { body: JSON.stringify({ course: courseData }) })
      }
      const data = await response.json

      setCourseData((prev) => ({ ...prev, ...data.course }))
      alert("Course saved successfully!")

      if (data.course.id) {
        // Navigate to edit page for the newly created course
        navigate(`/courses/${data.course.id}/edit`)
      }
      // router.push("/admin/courses")
    } catch (error) {
      console.error("Failed to save course:", error)
      alert("Failed to save course. Please try again.")
    }
  }

  const handlePublishCourse = () => {
    setCourseData((prev) => ({ ...prev, is_published: true }))
    // In a real app, this would publish the course
    alert("Course published successfully!")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="flex h-16 items-center px-4 md:px-6">
          <Link to="/courses/mine" className="flex items-center mr-4">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="hidden sm:inline">Back to Courses</span>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold truncate">{courseData.title || "New Course"}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/course/preview`}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleSaveCourse}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button size="sm" onClick={handlePublishCourse}>
              Publish
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 md:px-6 md:py-8">
        <Tabs defaultValue="details" className="space-y-4" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
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
              modules={courseData.modules as any[]}
              onModulesChange={async (modules: any[]) => {
                // Detect added module (present in modules, not in courseData.modules)
                const addedModule = modules.find(
                  (m) => !courseData.modules.some((old) => old.id === m.id)
                );
                if (addedModule && courseData.id) {
                  try {
                    const response = await post(
                      `/courses/${courseData.id}/course_modules.json`,
                      {
                        body: JSON.stringify({
                          course_module: {
                            title: addedModule.title,
                            description: addedModule.description,
                          },
                        }),
                      }
                    );
                    if (response.ok) {
                      const data = await response.json;
                      // Replace temp module with backend module
                      const newModules = modules.map((mod) =>
                        mod.id === addedModule.id ? data.course_module : mod
                      );
                      handleCourseDataChange({ modules: newModules });
                      return;
                    }
                  } catch (error) {
                    console.error("Failed to create module:", error);
                  }
                }

                // Detect added lessons for each module
                for (const mod of modules) {
                  const prevMod = courseData.modules.find((m) => m.id === mod.id);
                  if (!prevMod) continue;
                  const addedLesson = (mod.lessons || []).find(
                    (l) => !(prevMod.lessons || []).some((oldL) => oldL.id === l.id)
                  );
                  if (addedLesson && courseData.id && mod.id) {
                    try {
                      const response = await post(
                        `/courses/${courseData.id}/course_modules/${mod.id}/lessons.json`,
                        {
                          body: JSON.stringify({
                            lesson: {
                              title: addedLesson.title,
                              description: addedLesson.description,
                              duration: addedLesson.duration,
                              type: addedLesson.type,
                              // add other lesson fields as needed
                            },
                          }),
                        }
                      );
                      if (response.ok) {
                        const data = await response.json;
                        // Replace temp lesson with backend lesson
                        const newModules = modules.map((m) =>
                          m.id === mod.id
                            ? {
                                ...m,
                                lessons: m.lessons.map((lesson) =>
                                  lesson.id === addedLesson.id ? data.lesson : lesson
                                ),
                              }
                            : m
                        );
                        handleCourseDataChange({ modules: newModules });
                        return;
                      }
                    } catch (error) {
                      console.error("Failed to create lesson:", error);
                    }
                  }
                }

                // Otherwise, just update state
                handleCourseDataChange({ modules });
              }}
            />
          </TabsContent>

          <TabsContent value="resources">
            <ResourcesManager
              resources={courseData.resources as any[]}
              onResourcesChange={(resources: any[]) => handleCourseDataChange({ resources })}
            />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardContent className="pt-6">
                <CourseSettings courseData={courseData} onDataChange={handleCourseDataChange} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
