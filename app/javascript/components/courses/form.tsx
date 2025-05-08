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
import { post, put } from "@rails/request.js"

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
    instructorTitle: string
    isPublished: boolean
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
    instructorTitle: "",
    isPublished: false,
    modules: [],
    resources: [],
  })

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
    instructorTitle: string
    isPublished: boolean
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
    setCourseData((prev) => ({ ...prev, isPublished: true }))
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
              onModulesChange={(modules: any[]) => handleCourseDataChange({ modules })}
            />
          </TabsContent>

          <TabsContent value="resources">
            <ResourcesManager
              resources={courseData.resources}
              onResourcesChange={(resources) => handleCourseDataChange({ resources })}
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
