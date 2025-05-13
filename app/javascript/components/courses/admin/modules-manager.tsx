"use client"
import React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import SimpleEditor from "@/components/ui/SimpleEditor"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Plus, Trash2, GripVertical, Video, FileText, Edit, ArrowUp, ArrowDown } from "lucide-react"
import LessonForm from "@/components/courses/admin/lesson-form"
import { useToast } from "@/hooks/use-toast"
import { useForm, Controller } from "react-hook-form"

import { patch } from "@rails/request.js"

export default function ModulesManager({
  courseId,
  modules = [],
  onModuleCreate,
  onModuleUpdate,
  onModuleDelete,
  onLessonCreate,
  onLessonUpdate,
  onLessonDelete,
  onLessonDocumentCreate,
  onLessonDocumentDelete,
  refreshModules
}) {
  const [expandedModule, setExpandedModule] = useState(null)
  const [editingModule, setEditingModule] = useState(null) // module object or null
  const [addingLessonToModule, setAddingLessonToModule] = useState(null)
  const [editingLesson, setEditingLesson] = useState(null)
  // Add New Module form
  const [addModuleDialogOpen, setAddModuleDialogOpen] = useState(false)
  const { toast } = useToast()

  const handleAddModule = (data) => {
    if (!data.title.trim()) return
    onModuleCreate &&
      onModuleCreate({
        title: data.title,
        description: data.description,
        lessons: [],
      })
  }

  const handleDeleteModule = (moduleId) => {
    onModuleDelete && onModuleDelete(moduleId)
  }

  const handleAddLesson = (moduleId, lesson) => {
    onLessonCreate && onLessonCreate(moduleId, lesson)
    setAddingLessonToModule(null)
  }

  const handleUpdateLesson = (moduleId, lessonId, updatedLesson) => {
    onLessonUpdate && onLessonUpdate(moduleId, lessonId, updatedLesson)
    setEditingLesson(null)
  }

  const handleDeleteLesson = (moduleId, lessonId) => {
    onLessonDelete && onLessonDelete(moduleId, lessonId)
  }

  const moveModule = async (index, direction) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === modules.length - 1)) {
      return
    }
    const module = modules[index]
    if (!courseId || !module?.id) return

    // acts_as_list is 1-based
    const newPosition = index + direction + 1
    await patch(`/courses/${courseId}/course_modules/${module.id}/move`, {
      body: JSON.stringify({ position: newPosition }),
      headers: { "Content-Type": "application/json" }
    })
    // After move, trigger reload via onModuleUpdate (with no-op update)
    if (refreshModules) {
      await refreshModules()
    }
  }

  const moveLesson = async (moduleId, lessonIndex, direction) => {
    const module = modules.find((m) => m.id === moduleId)
    if (!module || !module.lessons) return
    if ((direction === -1 && lessonIndex === 0) || (direction === 1 && lessonIndex === module.lessons.length - 1)) {
      return
    }
    const lesson = module.lessons[lessonIndex]
    if (!courseId || !moduleId || !lesson?.id) return

    // acts_as_list is 1-based
    const newPosition = lessonIndex + direction + 1
    await patch(`/courses/${courseId}/course_modules/${moduleId}/lessons/${lesson.id}/move`, {
      body: JSON.stringify({ position: newPosition }),
      headers: { "Content-Type": "application/json" }
    })
    // After move, trigger reload via onLessonUpdate (with no-op update)
    if (onLessonUpdate) {
      await refreshModules()
      // await onLessonUpdate(moduleId, lesson.id, {})
    }
  }

  return (
    <div className="space-y-6">
      {/* Edit Module Dialog */}
      <Dialog open={!!editingModule} onOpenChange={(open) => { if (!open) setEditingModule(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{I18n.t("courses.modules_manager.edit_module")}</DialogTitle>
          </DialogHeader>
          {editingModule && (
            <EditModuleForm
              module={editingModule}
              onSubmit={async (data) => {
                await onModuleUpdate && onModuleUpdate(editingModule.id, data)
                setEditingModule(null)
                toast({ title: I18n.t("courses.modules_manager.module_updated") })
              }}
              onCancel={() => setEditingModule(null)}
            />
          )}
        </DialogContent>
      </Dialog>
      <Card>
        <CardHeader className="flex flex-row items-center">
          <CardTitle>{I18n.t("courses.modules_manager.course_modules")}</CardTitle>
          <Dialog open={addModuleDialogOpen} onOpenChange={setAddModuleDialogOpen}>
            <DialogTrigger asChild>
              <Button className="ml-auto space-x-2" onClick={() => setAddModuleDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2-" />
                <span className="hidden md:inline">
                  {I18n.t("courses.modules_manager.add_module")}
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{I18n.t("courses.modules_manager.add_new_module")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <AddModuleForm
                  onSubmit={(data) => {
                    handleAddModule(data)
                    setAddModuleDialogOpen(false)
                  }}
                  onCancel={() => setAddModuleDialogOpen(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {modules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{I18n.t("courses.modules_manager.no_modules")}</p>
            </div>
          ) : (
            <Accordion
              type="single"
              collapsible
              value={expandedModule}
              onValueChange={setExpandedModule}
              className="w-full"
            >
              {modules.map((module, moduleIndex) => (
                <AccordionItem
                  value={`module-${module.id}`}
                  key={module.id}
                  className="border rounded-md mb-4 overflow-hidden"
                >
                  <div className="flex items-center px-4 py-2 bg-muted/50">
                    <div className="flex items-center text-muted-foreground mr-2">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <AccordionTrigger className="hover:no-underline py-0 [&[data-state=open]>svg]:rotate-180">
                      <div className="flex-1 text-left font-medium">{module.title} {module.position}</div>
                    </AccordionTrigger>
                    <div className="flex items-center gap-1 ml-auto mr-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault()
                          moveModule(moduleIndex, -1)
                        }}
                        disabled={moduleIndex === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault()
                          moveModule(moduleIndex, 1)
                        }}
                        disabled={moduleIndex === modules.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingModule(module)
                        }}
                        aria-label="Edit module"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteModule(module.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <AccordionContent className="pt-2 pb-4">
                    <div className="px-4 space-y-4">
                      {module.description && 
                        <p className="text-sm text-muted-foreground"
                         dangerouslySetInnerHTML={{ __html: module.description }}/>
                      }

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Lessons</h4>
                          <Dialog
                            open={addingLessonToModule === module.id}
                            onOpenChange={(open) => {
                              if (!open) setAddingLessonToModule(null)
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setAddingLessonToModule(module.id)}>
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Add Lesson
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Add New Lesson</DialogTitle>
                              </DialogHeader>
                              {addingLessonToModule === module.id && (
                                <LessonForm
                                  onSubmit={(lessonData) => handleAddLesson(module.id, lessonData)}
                                  documents={module.documents || []}
                                  onDocumentCreate={(doc) => onLessonDocumentCreate && onLessonDocumentCreate(module.id, doc)}
                                  onDocumentDelete={(docId) => onLessonDocumentDelete && onLessonDocumentDelete(module.id, docId)}
                                />
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>

                        {module.lessons && module.lessons.length > 0 ? (
                          <div className="space-y-2">
                            {module.lessons.map((lesson, lessonIndex) => (
                              <div key={lesson.id} className="flex items-center p-3 rounded-md border bg-background">
                                <div className="flex items-center text-muted-foreground mr-2">
                                  <GripVertical className="h-4 w-4" />
                                </div>
                                <div className="mr-3">
                                  {lesson.type === "video" ? (
                                    <Video className="h-5 w-5 text-muted-foreground" />
                                  ) : (
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{lesson.title}</p>
                                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                                    <span>{lesson.duration}</span>
                                    {lesson.type && <span className="ml-2 capitalize">{lesson.type}</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 ml-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => moveLesson(module.id, lessonIndex, -1)}
                                    disabled={lessonIndex === 0}
                                  >
                                    <ArrowUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => moveLesson(module.id, lessonIndex, 1)}
                                    disabled={lessonIndex === module.lessons.length - 1}
                                  >
                                    <ArrowDown className="h-4 w-4" />
                                  </Button>
                                  <Dialog
                                    open={editingLesson?.id === lesson.id}
                                    onOpenChange={(open) => {
                                      if (!open) setEditingLesson(null)
                                    }}
                                  >
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditingLesson({ ...lesson, moduleId: module.id })}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                      <DialogHeader>
                                        <DialogTitle>Edit Lesson</DialogTitle>
                                      </DialogHeader>
                                      {editingLesson?.id === lesson.id && (
                                        <LessonForm
                                          lesson={lesson}
                                          onSubmit={(updatedLesson) =>
                                            handleUpdateLesson(module.id, lesson.id, updatedLesson)
                                          }
                                          documents={lesson.documents || []}
                                          onDocumentCreate={(doc) => onLessonDocumentCreate && onLessonDocumentCreate(module.id, doc, lesson.id)}
                                          onDocumentDelete={(docId) => onLessonDocumentDelete && onLessonDocumentDelete(module.id, docId, lesson.id)}
                                        />
                                      )}
                                    </DialogContent>
                                  </Dialog>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteLesson(module.id, lesson.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-sm text-muted-foreground border rounded-md">
                            <p>No lessons added yet. Click "Add Lesson" to create your first lesson.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

 
// EditModuleForm component (moved outside main component for syntax correctness)
function EditModuleForm({ module, onSubmit, onCancel }: any) {
  const form = useForm({
    defaultValues: {
      title: module.title || "",
      description: module.description || "",
    }
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 py-2"
      >
        <FormField
          control={form.control}
          name="title"
          rules={{ required: "Title is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Module Title</FormLabel>
              <FormControl>
                <Input
                  id="edit-module-title"
                  placeholder="e.g. Getting Started with Guitar"
                  {...field}
                />
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
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <SimpleEditor
                  value={field.value}
                  onChange={field.onChange}
                  scope="product"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Save Changes
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

// AddModuleForm component for Add New Module dialog
function AddModuleForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void, onCancel: () => void }) {
  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
    }
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          onSubmit(data);
          form.reset();
        })}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="title"
          rules={{ required: "Title is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Module Title</FormLabel>
              <FormControl>
                <Input
                  id="module-title"
                  placeholder="e.g. Getting Started with Guitar"
                  {...field}
                />
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
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <SimpleEditor
                  value={field.value}
                  onChange={field.onChange}
                  scope="product"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
          </DialogClose>
          <Button type="submit">Add Module</Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
