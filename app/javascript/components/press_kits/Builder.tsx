import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { get, put } from '@rails/request.js'
import { useToast } from '@/hooks/use-toast'
import useAuthStore from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared'
import { PuckEditor } from '@/components/puck'
import TemplateSelector from '@/components/shared/TemplateSelector'
import pressKitTemplates from './templates'

export default function PressKitBuilder() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [data, setData] = useState<any>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const canEdit = currentUser && (currentUser.username === username || currentUser.role === 'admin')

  useEffect(() => {
    if (!canEdit) {
      navigate(`/${username}/presskit`)
      return
    }
    loadPressKit()
  }, [username, canEdit])

  const loadPressKit = async () => {
    try {
      setLoading(true)
      const response = await get(`/${username}/presskit.json`)
      
      if (response.ok) {
        const pressKitData = await response.json
        
        // Check if editor_data exists
        if (pressKitData.editor_data && Object.keys(pressKitData.editor_data).length > 0) {
          setData(pressKitData.editor_data)
          setShowTemplateSelector(false)
        } else {
          // Show template selector for new press kits
          setShowTemplateSelector(true)
        }
      }
    } catch (error) {
      console.error('Error loading press kit:', error)
      toast({
        title: 'Error',
        description: 'Failed to load press kit',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template.id)
    setData(template.data)
    setShowTemplateSelector(false)
    
    toast({
      description: `${template.name} template selected`,
    })
  }

  const handleSave = async (editorData: any) => {
    try {
      const response = await put(`/${username}/presskit.json`, {
        body: JSON.stringify({
          press_kit: {
            editor_data: editorData,
            use_builder: true
          }
        }),
        contentType: 'application/json'
      })

      if (response.ok) {
        toast({
          description: 'Press kit saved successfully'
        })
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error('Error saving press kit:', error)
      toast({
        title: 'Error',
        description: 'Failed to save press kit',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (showTemplateSelector) {
    return (
      <div>
        <div className="border-b bg-background">
          <div className="container mx-auto px-4 py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/${username}/presskit`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Press Kit
            </Button>
          </div>
        </div>
        <TemplateSelector
          templates={pressKitTemplates}
          onSelectTemplate={handleTemplateSelect}
          selectedTemplateId={selectedTemplate}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="border-b bg-background flex items-center justify-between px-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/${username}/presskit`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTemplateSelector(true)}
        >
          Change Template
        </Button>
      </div>
      <PuckEditor data={data} onPublish={handleSave} />
    </div>
  )
}
