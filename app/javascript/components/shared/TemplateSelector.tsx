import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  preview: string
  data: any
}

interface TemplateSelectorProps {
  templates: Template[]
  onSelectTemplate: (template: Template) => void
  selectedTemplateId?: string
}

export default function TemplateSelector({ 
  templates, 
  onSelectTemplate, 
  selectedTemplateId 
}: TemplateSelectorProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Choose a Template</h2>
        <p className="text-muted-foreground">
          Select a template to get started with your press kit
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card 
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedTemplateId === template.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onSelectTemplate(template)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle>{template.name}</CardTitle>
                {selectedTemplateId === template.id && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-md overflow-hidden">
                {template.preview ? (
                  <img 
                    src={template.preview} 
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    Preview
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
