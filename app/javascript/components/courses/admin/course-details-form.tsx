"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Upload, X, ImageIcon } from "lucide-react"
import { ImageUploader } from "@/components/ui/image-uploader"
import { useForm } from "react-hook-form"
import { useToast } from "@/hooks/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Label } from "@/components/ui/label"

const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  category: z.string().min(1, { message: "Please select a category" }),
  level: z.string().min(1, { message: "Please select a level" }),
  duration: z.string().min(1, { message: "Please enter estimated duration" }),
  price: z.string().min(1, { message: "Please enter a price" }),
  instructor: z.string().min(1, { message: "Please enter instructor name" }),
  instructor_title: z.string().min(1, { message: "Please enter instructor title" }),
  thumbnail: z.string().optional(),
  thumbnail_url: z.string().optional(),
  instructor_image: z.string().optional(),
  instructor_image_url: z.string().optional(),
})

interface CourseDetailsFormProps {
  courseData: {
    id?: number | null
    title: string
    description: string
    category: string
    level: string
    duration: string
    price: string
    instructor: string
    instructor_title: string
    thumbnail?: string
    thumbnail_url?: string
  }
  onDataChange: (data: Partial<CourseDetailsFormProps["courseData"]>) => void
}

export default function CourseDetailsForm({ courseData, onDataChange }: CourseDetailsFormProps) {
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [instructorImagePreview, setInstructorImagePreview] = useState<string | null>(null)
  const { toast } = useToast()
  const [isInitialized, setIsInitialized] = useState(false)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: courseData.title || "",
      description: courseData.description || "",
      category: courseData.category || "",
      level: courseData.level || "beginner",
      duration: courseData.duration || "",
      price: courseData.price || "",
      instructor: courseData.instructor || "",
      instructor_title: courseData.instructor_title || "",
      thumbnail: (courseData as any).thumbnail || "",
      thumbnail_url: (courseData as any).thumbnail_url || "",
      instructor_image: (courseData as any).instructor_image || "",
      instructor_image_url: (courseData as any).instructor_image_url || "",
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
        price: courseData.price || "",
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
      <form className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Guitar Fundamentals" {...field} />
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
                  <FormLabel>Course Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what students will learn in this course"
                      className="min-h-[120px]"
                      {...field}
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
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="instruments">Instruments</SelectItem>
                        <SelectItem value="theory">Music Theory</SelectItem>
                        <SelectItem value="vocals">Vocals</SelectItem>
                        <SelectItem value="composition">Composition</SelectItem>
                        <SelectItem value="production">Music Production</SelectItem>
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
                    <FormLabel>Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="all-levels">All Levels</SelectItem>
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
                    <FormLabel>Estimated Duration</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 12 hours" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 49.99" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="thumbnail">Course Thumbnail</Label>
              <div className="mt-2 flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 h-[auto]">
                <ImageUploader
                  cropUploadMode={"crop"}
                  imageUrl={courseData.thumbnail_url}
                  previewImage={courseData.thumbnail_url}
                  onUploadComplete={async (signedBlobId, cropData, serviceUrl) => {
                    if (signedBlobId) {
                      form.setValue("thumbnail", signedBlobId)
                    }
                    if (serviceUrl) {
                      setThumbnailPreview(serviceUrl)
                      form.setValue("thumbnail_url", serviceUrl)
                    }
                    toast({ description: "Thumbnail uploaded successfully!" })
                  }}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="instructor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructor Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instructor_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructor Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Professional Guitarist & Music Teacher" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Label htmlFor="instructor-image">Instructor Image</Label>
              <div className="mt-2 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 h-[100px]">
                <ImageUploader
                  value={form.getValues("instructor_image")}
                  onUploadComplete={async (signedBlobId, cropData, serviceUrl) => {
                    if (signedBlobId) {
                      form.setValue("instructor_image", signedBlobId)
                    }
                    if (serviceUrl) {
                      setInstructorImagePreview(serviceUrl)
                      form.setValue("instructor_image_url", serviceUrl)
                    }
                    toast({ description: "Instructor image uploaded successfully!" })
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </Form>
  )
}
