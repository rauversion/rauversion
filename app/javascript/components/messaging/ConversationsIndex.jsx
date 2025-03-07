import React from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useNavigate, useParams } from 'react-router-dom'
import { 
  Search, 
  Archive, 
  Trash2, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Clock
} from 'lucide-react'
import ConversationList from './ConversationList'
import Conversation from './Conversation'

const ConversationsIndex = ({ currentUserId }) => {
  const navigate = useNavigate()
  const { conversationId } = useParams()

  const handleConversationSelect = (id) => {
    navigate(`/conversations/${id}`)
  }

  return (
    <div className="h-[calc(100vh-85px)] flex flex-col">
      {/* Top Navigation Bar */}
      <div className="border-b">
        <div className="flex h-16 items-center px-4 gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search messages" 
                className="pl-8 w-[400px]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Archive className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Clock className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 ml-4 border-l pl-4">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex h-[calc(100vh-47px)]">
        {/* Left Sidebar */}
        <div className="w-[300px] border-r flex flex-col">
          <div className="p-4 border-b">
            <Button 
              className="w-full"
              onClick={() => navigate('/conversations/new')}
            >
              New Message
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <ConversationList
              selectedId={conversationId ? parseInt(conversationId) : null}
              onSelect={handleConversationSelect}
            />
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {conversationId ? (
            <Conversation
              conversationId={parseInt(conversationId)}
              currentUserId={currentUserId}
            />
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
        </div>
      </div>
    </div>
  )
}

export default ConversationsIndex
