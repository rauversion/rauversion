import React, { useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { useActionCable } from '@/hooks/useActionCable'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import useConversationStore from '../../stores/conversationStore'
import Message from './Message'
import I18n from '@/stores/locales'

const MessagingContainer = ({ 
  currentUserId,
  messageable = { type: 'User', id: currentUserId },
  height = 'h-[500px]',
  className = ''
}) => {
  const { toast } = useToast()
  const { subscribe, unsubscribe } = useActionCable()
  const { 
    currentConversation,
    messages,
    loading,
    error,
    fetchConversation,
    sendMessage,
    appendMessage
  } = useConversationStore()

  useEffect(() => {
    // Find or create conversation for this messageable
    const initializeConversation = async () => {
      try {
        const response = await fetch('/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversation: {
              messageable_type: messageable.type,
              messageable_id: messageable.id
            }
          })
        })
        const data = await response.json()
        
        if (data.conversation) {
          fetchConversation(data.conversation.id)

          // Subscribe to conversation updates
          subscribe(
            'ConversationChannel',
            { conversation_id: data.conversation.id },
            {
              received: (data) => {
                if (data.type === 'new_message') {
                  appendMessage(data.message)
                }
              }
            }
          )
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: I18n.t('messages.error'),
          description: I18n.t('messages.notifications.error.create')
        })
      }
    }

    initializeConversation()

    return () => {
      unsubscribe('ConversationChannel')
    }
  }, [messageable.type, messageable.id])

  if (loading) {
    return (
      <Card className={`flex items-center justify-center ${height} ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-muted-foreground">{I18n.t('messages.loading')}</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`flex items-center justify-center ${height} ${className}`}>
        <div className="text-center text-destructive">
          <p className="text-sm">{I18n.t('messages.error')}</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      </Card>
    )
  }

  if (!currentConversation) {
    return (
      <Card className={`flex items-center justify-center ${height} ${className}`}>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">{I18n.t('messages.no_messages')}</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`flex flex-col ${height} ${className}`}>
      <ScrollArea className="flex-1 p-4">
        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
            currentUserId={currentUserId}
          />
        ))}
      </ScrollArea>

      {currentConversation.status === 'active' && (
        <div className="border-t p-4">
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              const message = e.target.message.value
              if (message.trim()) {
                sendMessage(currentConversation.id, message)
                e.target.reset()
              }
            }} 
            className="flex items-center gap-4"
          >
            <input
              type="text"
              name="message"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={I18n.t('messages.reply')}
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              {I18n.t('messages.send')}
            </button>
          </form>
        </div>
      )}
    </Card>
  )
}

export default MessagingContainer
