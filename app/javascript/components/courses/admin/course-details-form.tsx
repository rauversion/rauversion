"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import SimpleEditor from "@/components/ui/SimpleEditor";
import CourseCoverEditor from "@/components/courses/admin/course-cover-editor"
import { CourseCoverData } from "@/components/courses/CourseCover"


const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  category: z.string().min(1, { message: "Please select a category" }),
  level: z.string().min(1, { message: "Please select a level" }),
  duration: z.string().min(1, { message: "Please enter estimated duration" }),
  instructor: z.string().min(1, { message: "Please enter instructor name" }),
  instructor_title: z.string().min(1, { message: "Please enter instructor title" }),
})

interface CourseDetailsFormProps {
  courseData: CourseCoverData & {
    id?: number | null
    title: string
    description: string
    category: string
    level: string
    duration: string
    price: string
    instructor: string
    instructor_title: string
  }
  onDataChange: (data: Partial<CourseDetailsFormProps["courseData"]>) => void
  introUploading: boolean
  onIntroUploadingChange: (uploading: boolean) => void
}

export default function CourseDetailsForm({ courseData, onDataChange, introUploading, onIntroUploadingChange }: CourseDetailsFormProps) {
  const [isInitialized, setIsInitialized] = useState(false)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: courseData.title || "",
      description: courseData.description || "",
      category: courseData.category || "",
      level: courseData.level || "beginner",
      duration: courseData.duration || "",
      instructor: courseData.instructor || "",
      instructor_title: courseData.instructor_title || "",
    }
  })

  // Memoize the update function to prevent unnecessary re-renders
  const updateParent = useCallback(
    (data: Partial<CourseDetailsFormProps["courseData"]>) => {
      if (isInitialized) {
        onDataChange(data)
      }
    },
    [onDataChange, isInitialized],
  )

  // Update form when courseData changes, but only if courseData.id changes or on initial mount
  useEffect(() => {
    const currentId = (form.getValues() as any).id
    if (!isInitialized || courseData.id !== currentId) {
      form.reset({
        title: courseData.title || "",
        description: courseData.description || "",
        category: courseData.category || "",
        level: courseData.level || "beginner",
        duration: courseData.duration || "",
        instructor: courseData.instructor || "",
        instructor_title: courseData.instructor_title || "",
      })
      if (!isInitialized) {
        setIsInitialized(true)
      }
    }
  }, [courseData.id, form, isInitialized])

  // Use a debounced approach to update parent component
  useEffect(() => {
    const subscription = form.watch((value) => {
      // Only update if all required fields have values
      if (Object.values(value).every((val) => val !== undefined)) {
        const timeoutId = setTimeout(() => {
          updateParent(value)
        }, 300) // 300ms debounce

        return () => clearTimeout(timeoutId)
      }
    })

    return () => subscription.unsubscribe()
  }, [form, updateParent])


  return (
    <Form {...form}>
      <form className="space-y-8" onSubmit={(event) => event.preventDefault()}>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{I18n.t("courses.details_form.course_title")}</FormLabel>
                  <FormControl>
                    <Input placeholder={I18n.t("courses.details_form.course_title_placeholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{I18n.t("courses.details_form.course_description")}</FormLabel>
                  <FormControl>
                    <SimpleEditor
                      value={field.value}
                      onChange={field.onChange}
                      scope="courses"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{I18n.t("courses.details_form.category")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={I18n.t("courses.details_form.select_category")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="instruments">{I18n.t("courses.details_form.instruments")}</SelectItem>
                        <SelectItem value="theory">{I18n.t("courses.details_form.music_theory")}</SelectItem>
                        <SelectItem value="vocals">{I18n.t("courses.details_form.vocals")}</SelectItem>
                        <SelectItem value="composition">{I18n.t("courses.details_form.composition")}</SelectItem>
                        <SelectItem value="production">{I18n.t("courses.details_form.music_production")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{I18n.t("courses.details_form.level")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={I18n.t("courses.details_form.select_level")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">{I18n.t("courses.details_form.beginner")}</SelectItem>
                        <SelectItem value="intermediate">{I18n.t("courses.details_form.intermediate")}</SelectItem>
                        <SelectItem value="advanced">{I18n.t("courses.details_form.advanced")}</SelectItem>
                        <SelectItem value="all-levels">{I18n.t("courses.details_form.all_levels")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{I18n.t("courses.details_form.estimated_duration")}</FormLabel>
                    <FormControl>
                      <Input placeholder={I18n.t("courses.details_form.estimated_duration_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-6">
            <CourseCoverEditor course={courseData} onChange={onDataChange} uploading={introUploading} onUploadingChange={onIntroUploadingChange} />
          </div>
        </div>
      </form>
    </Form>
  )
}
