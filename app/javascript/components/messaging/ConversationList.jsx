import React, { useEffect } from 'react'
import { cn } from "@/lib/utils"
import { Link } from "react-router"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useActionCable } from '@/hooks/useActionCable'
import useConversationStore from '../../stores/conversationStore'
import I18n from '@/stores/locales'

const ConversationItem = ({ conversation, isSelected, onClick }) => {
  const lastMessage = conversation.last_message
  const participant = conversation.participants[0]

  return (
    <Link
      to={`/conversations/${conversation.id}`}
      //onClick={onClick}
      className={cn(
        "flex flex-col gap-1 p-3 cursor-pointer hover:bg-muted/50 transition-colors",
        isSelected && "bg-muted"
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={participant.user.avatar_url} />
          <AvatarFallback>{participant.user.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={cn(
              "truncate text-sm font-medium",
              !lastMessage?.read && "font-semibold"
            )}>
              {participant.user.username}
            </p>
            {lastMessage && (
              <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                {new Date(lastMessage.created_at).toLocaleDateString()}
              </span>
            )}
          </div>

          <p className="text-sm font-medium truncate text-muted-foreground">
            {conversation.subject}
          </p>

          {lastMessage && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {lastMessage.body}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2">
            <Badge 
              variant={
                conversation.status === 'active' ? 'default' :
                conversation.status === 'archived' ? 'secondary' :
                'outline'
              }
              className="text-[10px] px-1"
            >
              {I18n.t(`messages.status.${conversation.status}`)}
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
    </Link>
  )
}

const ConversationList = ({ selectedId, onSelect }) => {
  const { subscribe, unsubscribe } = useActionCable()
  const { 
    conversations, 
    loading, 
    error, 
    fetchConversations,
    appendMessage 
  } = useConversationStore()

  useEffect(() => {
    fetchConversations()

    // Subscribe to notifications for new messages
    const channel = subscribe(
      'NotificationsChannel',
      {},
      {
        received: (data) => {
          if (data.type === 'new_message') {
            appendMessage(data.message)
          }
        }
      }
    )

    return () => {
      unsubscribe('NotificationsChannel')
    }
  }, [])

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-muted-foreground">{I18n.t('messages.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="text-center text-destructive">
          <p className="text-sm">{I18n.t('messages.error')}</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      </div>
    )
  }

  // Sort conversations by last message date
  const sortedConversations = [...conversations].sort((a, b) => {
    const dateA = a.last_message?.created_at || a.updated_at
    const dateB = b.last_message?.created_at || b.updated_at
    return new Date(dateB) - new Date(dateA)
  })

  return (
    <ScrollArea className="h-[calc(100vh-22rem)]">
      <div className="divide-y">
        {sortedConversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <p className="text-sm">{I18n.t('messages.no_messages')}</p>
            <p className="text-xs mt-1">{I18n.t('messages.start_conversation')}</p>
          </div>
        ) : (
          sortedConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedId === conversation.id}
              onClick={() => onSelect(conversation.id)}
            />
          ))
        )}
      </div>
    </ScrollArea>
  )
}

export default ConversationList
