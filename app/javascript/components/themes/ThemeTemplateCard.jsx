import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Github } from 'lucide-react'

export function ThemeTemplateCard({ theme, onActivate }) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{theme.name}</CardTitle>
            <CardDescription className="mt-1">
              {theme.description || 'No description available'}
            </CardDescription>
          </div>
          {theme.system_theme && (
            <Badge variant="secondary" className="ml-2">
              System
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {theme.deploy_options?.repo && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Github className="h-4 w-4" />
              <span className="font-mono text-xs">{theme.deploy_options.repo}</span>
            </div>
          )}
          
          <Button 
            onClick={() => onActivate(theme)}
            className="w-full"
            variant="default"
          >
            <Download className="mr-2 h-4 w-4" />
            Activate Theme
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
