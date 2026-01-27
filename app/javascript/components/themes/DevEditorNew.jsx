import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { ThemeTemplateCard } from './ThemeTemplateCard'
import { ThemeActivationModal } from './ThemeActivationModal'
import { fetchThemes } from '@/lib/themeApi'
import { useThemeDownloadStore } from '@/stores/themeDownloadStore'
import { Loader2 } from 'lucide-react'

export function DevEditorNew({ siteId, onThemeFilesReady }) {
  const { toast } = useToast()
  const { themes, loading, setThemes, setLoading } = useThemeDownloadStore()
  const [selectedTheme, setSelectedTheme] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    loadThemes()
  }, [siteId])

  const loadThemes = async () => {
    setLoading(true)
    try {
      const themesData = await fetchThemes(siteId)
      setThemes(themesData)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load themes',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleActivateTheme = (theme) => {
    setSelectedTheme(theme)
    setModalOpen(true)
  }

  const handleFilesReady = (files) => {
    toast({
      title: 'Success',
      description: `Theme "${selectedTheme.name}" activated successfully!`
    })
    
    // Pass files to parent component for WebContainer integration
    if (onThemeFilesReady) {
      onThemeFilesReady(files, selectedTheme)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dev Editor</h1>
        <p className="text-muted-foreground">
          Build and customize your site with our visual editor and theme templates
        </p>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList>
          <TabsTrigger value="templates">Quick Start Templates</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Start Templates</CardTitle>
              <CardDescription>
                Choose from our collection of professionally designed themes. 
                Click on a theme to activate it and start customizing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : themes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No themes available
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {themes.map((theme) => (
                    <ThemeTemplateCard
                      key={theme.id}
                      theme={theme}
                      onActivate={handleActivateTheme}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="editor">
          <Card>
            <CardHeader>
              <CardTitle>Visual Editor</CardTitle>
              <CardDescription>
                Edit your site with our visual editor (coming soon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Editor interface will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedTheme && (
        <ThemeActivationModal
          theme={selectedTheme}
          open={modalOpen}
          onOpenChange={setModalOpen}
          onFilesReady={handleFilesReady}
        />
      )}
    </div>
  )
}
