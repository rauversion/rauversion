"use client"
import React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

export default function ModulesManager({
  modules = [],
  onModuleCreate,
  onModuleUpdate,
  onModuleDelete,
  onLessonCreate,
  onLessonUpdate,
  onLessonDelete,
}) {
  const [expandedModule, setExpandedModule] = useState(null)
  const [editingModule, setEditingModule] = useState(null)
  const [addingLessonToModule, setAddingLessonToModule] = useState(null)
  const [editingLesson, setEditingLesson] = useState(null)
  const [newModule, setNewModule] = useState({
    title: "",
    description: "",
  })

  const handleAddModule = () => {
    if (!newModule.title.trim()) return
    onModuleCreate &&
      onModuleCreate({
        title: newModule.title,
        description: newModule.description,
        lessons: [],
      })
    setNewModule({ title: "", description: "" })
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

  const moveModule = (index, direction) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === modules.length - 1)) {
      return
    }

    const newModules = [...modules]
    const temp = newModules[index]
    newModules[index] = newModules[index + direction]
    newModules[index + direction] = temp

    onModulesChange(newModules)
  }

  const moveLesson = (moduleId, lessonIndex, direction) => {
    const moduleIndex = modules.findIndex((m) => m.id === moduleId)
    if (moduleIndex === -1) return

    const module = modules[moduleIndex]
    if ((direction === -1 && lessonIndex === 0) || (direction === 1 && lessonIndex === module.lessons.length - 1)) {
      return
    }

    const newModules = [...modules]
    const lessons = [...module.lessons]
    const temp = lessons[lessonIndex]
    lessons[lessonIndex] = lessons[lessonIndex + direction]
    lessons[lessonIndex + direction] = temp

    newModules[moduleIndex] = {
      ...module,
      lessons,
    }

    onModulesChange(newModules)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center">
          <CardTitle>Course Modules</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="ml-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Module
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Module</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="module-title" className="text-sm font-medium">
                    Module Title
                  </label>
                  <Input
                    id="module-title"
                    placeholder="e.g. Getting Started with Guitar"
                    value={newModule.title}
                    onChange={(e) => setNewModule((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="module-description" className="text-sm font-medium">
                    Description (Optional)
                  </label>
                  <Textarea
                    id="module-description"
                    placeholder="Brief description of this module"
                    value={newModule.description}
                    onChange={(e) => setNewModule((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button onClick={handleAddModule}>Add Module</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {modules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No modules added yet. Click "Add Module" to create your first module.</p>
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
                      <div className="flex-1 text-left font-medium">{module.title}</div>
                    </AccordionTrigger>
                    <div className="flex items-center gap-1 ml-auto mr-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
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
                          e.stopPropagation()
                          moveModule(moduleIndex, 1)
                        }}
                        disabled={moduleIndex === modules.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
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
                      {module.description && <p className="text-sm text-muted-foreground">{module.description}</p>}

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
                                <LessonForm onSubmit={(lessonData) => handleAddLesson(module.id, lessonData)} />
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
