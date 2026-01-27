import React, { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { useActionCable } from '@/hooks/useActionCable'
import { useThemeDownloadStore } from '@/stores/themeDownloadStore'
import { downloadThemeTarball } from '@/lib/themeApi'

export function ThemeActivationModal({ 
  theme, 
  open, 
  onOpenChange, 
  onFilesReady 
}) {
  const { subscribe, unsubscribe } = useActionCable()
  const {
    downloadStatus,
    downloadProgress,
    downloadMessage,
    downloadedFiles,
    setDownloadStatus,
    setDownloadProgress,
    setDownloadMessage,
    setDownloadedFiles,
    resetDownload
  } = useThemeDownloadStore()

  useEffect(() => {
    if (!open) {
      resetDownload()
    }
  }, [open, resetDownload])

  useEffect(() => {
    if (open && theme && downloadStatus === 'started') {
      // Subscribe to ActionCable channel for progress updates
      subscribe(
        'ThemeDownloadChannel',
        { theme_id: theme.id },
        {
          received: (data) => {
            console.log('Received theme download update:', data)
            setDownloadStatus(data.status)
            setDownloadProgress(data.progress)
            setDownloadMessage(data.message)
            
            if (data.status === 'completed' && data.files) {
              setDownloadedFiles(data.files)
              // Notify parent component that files are ready
              if (onFilesReady) {
                onFilesReady(data.files)
              }
            }
          }
        }
      )

      return () => {
        unsubscribe('ThemeDownloadChannel')
      }
    }
  }, [open, theme, downloadStatus, subscribe, unsubscribe, onFilesReady])

  const handleActivate = async () => {
    try {
      setDownloadStatus('started')
      setDownloadProgress(0)
      setDownloadMessage('Initiating theme download...')
      
      await downloadThemeTarball(theme.id)
    } catch (error) {
      setDownloadStatus('error')
      setDownloadMessage(error.message || 'Failed to initiate theme download')
    }
  }

  const handleClose = () => {
    if (downloadStatus !== 'downloading' && downloadStatus !== 'extracting' && downloadStatus !== 'processing') {
      onOpenChange(false)
    }
  }

  const isDownloading = ['started', 'downloading', 'extracting', 'processing'].includes(downloadStatus)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Activate Theme</DialogTitle>
          <DialogDescription>
            {!downloadStatus && `Activate "${theme?.name}" theme? This will download the theme files from GitHub and add them to your workspace.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {downloadStatus && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{downloadMessage}</span>
                  <span className="font-medium">{downloadProgress}%</span>
                </div>
                <Progress value={downloadProgress} className="h-2" />
              </div>

              {downloadStatus === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{downloadMessage}</AlertDescription>
                </Alert>
              )}

              {downloadStatus === 'completed' && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">
                    Theme activated successfully! {downloadedFiles?.length || 0} files downloaded.
                  </AlertDescription>
                </Alert>
              )}

              {isDownloading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Please wait while the theme is being downloaded...</span>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          {!downloadStatus && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleActivate}>
                Activate Theme
              </Button>
            </>
          )}
          
          {downloadStatus === 'completed' && (
            <Button onClick={handleClose}>
              Close
            </Button>
          )}

          {downloadStatus === 'error' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleActivate}>
                Try Again
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
