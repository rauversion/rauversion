import React from 'react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { useNavigate, useParams } from 'react-router-dom'
import ConversationList from './ConversationList'
import Conversation from './Conversation'

const ConversationsIndex = ({ currentUserId }) => {
  const navigate = useNavigate()
  const { conversationId } = useParams()

  const handleConversationSelect = (id) => {
    navigate(`/conversations/${id}`)
  }

  return (
    <div className="h-screen">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Messages</h1>
          </div>
        </div>
      </div>

      <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh-4rem)]">
        <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
          <div className="flex h-full flex-col">
            <div className="p-4">
              <Button className="w-full" onClick={() => navigate('/conversations/new')}>
                New Conversation
              </Button>
            </div>
            <Separator />
            <ScrollArea className="flex-1">
              <ConversationList
                selectedId={conversationId ? parseInt(conversationId) : null}
                onSelect={handleConversationSelect}
              />
            </ScrollArea>
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={75}>
          <ScrollArea className="h-full">
            {conversationId ? (
              <div className="p-4">
                <Conversation
                  conversationId={parseInt(conversationId)}
                  currentUserId={currentUserId}
                />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-medium">No conversation selected</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a conversation from the sidebar or start a new one
                  </p>
                </div>
              </div>
            )}
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default ConversationsIndex
