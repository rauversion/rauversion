import React from 'react'
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import useConversationStore from '../../stores/conversationStore'

const ConversationItem = ({ conversation, isSelected, onClick }) => {
  const lastMessage = conversation.last_message
  const participant = conversation.participants[0]

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex flex-col gap-1 p-3 cursor-pointer hover:bg-muted/50",
        isSelected && "bg-muted"
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={participant.user.avatar_url} />
          <AvatarFallback>{participant.user.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-1 overflow-hidden">
          <div className="flex items-center justify-between">
            <p className={cn(
              "truncate text-sm font-medium",
              !lastMessage?.read && "font-semibold"
            )}>
              {participant.user.username}
            </p>
            {lastMessage && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(lastMessage.created_at).toLocaleDateString()}
              </span>
            )}
          </div>

          <p className="text-sm font-medium truncate">
            {conversation.subject}
          </p>

          {lastMessage && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {lastMessage.body}
            </p>
          )}

          <div className="flex items-center gap-2 mt-1">
            <Badge 
              variant={
                conversation.status === 'active' ? 'default' :
                conversation.status === 'archived' ? 'secondary' :
                'outline'
              }
              className="text-[10px] px-1"
            >
              {conversation.status}
            </Badge>

            {conversation.messageable_type && (
              <Badge 
                variant="outline" 
                className="text-[10px] px-1"
              >
                {conversation.messageable_type}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const ConversationList = ({ selectedId, onSelect }) => {
  const { conversations, loading, error, fetchConversations } = useConversationStore()

  React.useEffect(() => {
    fetchConversations()
  }, [])

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="text-center text-destructive">
          <p className="text-sm">Error loading conversations</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="divide-y">
      {conversations.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground">
          <p className="text-sm">No conversations yet</p>
          <p className="text-xs mt-1">Start a new conversation to get started</p>
        </div>
      ) : (
        conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isSelected={selectedId === conversation.id}
            onClick={() => onSelect(conversation.id)}
          />
        ))
      )}
    </div>
  )
}

export default ConversationList
