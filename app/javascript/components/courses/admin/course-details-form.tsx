"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Upload, X, ImageIcon } from "lucide-react"
import { useForm } from "react-hook-form"
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
  instructorTitle: z.string().min(1, { message: "Please enter instructor title" }),
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
    instructorTitle: string
  }
  onDataChange: (data: Partial<CourseDetailsFormProps["courseData"]>) => void
}

export default function CourseDetailsForm({ courseData, onDataChange }: CourseDetailsFormProps) {
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [instructorImagePreview, setInstructorImagePreview] = useState<string | null>(null)
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
      instructorTitle: courseData.instructorTitle || "",
    },
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
        instructorTitle: courseData.instructorTitle || "",
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

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleInstructorImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setInstructorImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              <div className="mt-2 flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 h-[200px]">
                {thumbnailPreview ? (
                  <div className="relative w-full h-full">
                    <img
                      src={thumbnailPreview || "/placeholder.svg"}
                      alt="Course thumbnail preview"
                      className="w-full h-full object-cover rounded-md"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full"
                      onClick={() => setThumbnailPreview(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center">
                    <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">Upload course thumbnail</p>
                    <p className="text-xs text-muted-foreground mb-4">Recommended size: 1280x720px</p>
                    <Button variant="outline" size="sm" className="relative">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                      <input
                        id="thumbnail"
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept="image/*"
                        onChange={handleThumbnailUpload}
                      />
                    </Button>
                  </div>
                )}
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
              name="instructorTitle"
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
                {instructorImagePreview ? (
                  <div className="relative h-full aspect-square">
                    <img
                      src={instructorImagePreview || "/placeholder.svg"}
                      alt="Instructor image preview"
                      className="h-full aspect-square object-cover rounded-full"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-0 right-0 h-6 w-6 rounded-full"
                      onClick={() => setInstructorImagePreview(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Button variant="outline" size="sm" className="relative">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                      <input
                        id="instructor-image"
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept="image/*"
                        onChange={handleInstructorImageUpload}
                      />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </Form>
  )
}
