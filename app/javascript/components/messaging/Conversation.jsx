import React, { useEffect, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useToast } from '@/hooks/use-toast'
import { useActionCable } from '@/hooks/useActionCable'
import { cn } from "@/lib/utils"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { Reply, MoreHorizontal, Archive, Trash2 } from 'lucide-react'
import useConversationStore from '../../stores/conversationStore'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import Message from './Message'
import I18n from '@/stores/locales'

const Conversation = ({ conversationId, currentUserId }) => {
  const { toast } = useToast()
  const messagesEndRef = useRef(null)
  const scrollAreaRef = useRef(null)
  const { register, handleSubmit, reset } = useForm()
  const { subscribe, unsubscribe } = useActionCable()
  
  const {
    currentConversation,
    loading: conversationLoading,
    error: conversationError,
    fetchConversation,
    sendMessage,
    updateConversationStatus,
    appendMessage,
    messages,
    setMessages
  } = useConversationStore()

  window.messages = messages

  const {
    items: paginatedMessages,
    loading: messagesLoading,
    error: messagesError,
    hasMore,
    loadMore,
    resetList: resetMessages
  } = useInfiniteScroll(`/conversations/${conversationId}/messages.json`, {
    reverse: true,
    perPage: 20
  })

  useEffect(()=>{
    if(!paginatedMessages.length > 0) return
    if(messagesLoading) return
    //if(conversationLoading) return
    debugger
    setMessages(paginatedMessages)
  }, [paginatedMessages, conversationId])

  useEffect(() => {
    if (conversationId) {
      fetchConversation(conversationId)
      resetMessages()

      // Subscribe to conversation channel
      const channel = subscribe(
        'ConversationChannel',
        { conversation_id: conversationId },
        {
          received: (data) => {
            debugger
            if (data.type === 'new_message') {
              appendMessage(data.message)
            }
          }
        }
      )

      return () => {
        unsubscribe('ConversationChannel')
      }
    }
  }, [conversationId])

  useEffect(() => {
    if (conversationError) {
      toast({
        variant: "destructive",
        title: I18n.t('messages.error'),
        description: conversationError
      })
    }
  }, [conversationError])

  useEffect(() => {
    if (messagesError) {
      toast({
        variant: "destructive",
        title: I18n.t('messages.error'),
        description: messagesError
      })
    }
  }, [messagesError])

  useEffect(() => {
    // Only scroll to bottom on new messages
    if (messages.length > 0 && !messagesLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, messagesLoading])

  const handleScroll = useCallback((event) => {
    const { scrollTop } = event.target
    
    // Load more when scrolled near the top
    if (scrollTop < 100 && hasMore && !messagesLoading) {
      loadMore()
    }
  }, [hasMore, messagesLoading, loadMore])

  const onSubmit = async (data) => {
    try {
      await sendMessage(conversationId, data.message)
      reset()
      toast({
        title: I18n.t('messages.notifications.message_sent')
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: I18n.t('messages.error'),
        description: I18n.t('messages.notifications.error.send')
      })
    }
  }

  const handleStatusUpdate = async (status) => {
    try {
      await updateConversationStatus(conversationId, status)
      toast({
        title: I18n.t('messages.notifications.status_updated', { status: I18n.t(`messages.status.${status}`) })
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: I18n.t('messages.error'),
        description: I18n.t('messages.notifications.error.status')
      })
    }
  }

  if (conversationLoading && !currentConversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-muted-foreground">{I18n.t('messages.loading')}</p>
        </div>
      </div>
    )
  }

  if (!currentConversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-medium">{I18n.t('messages.no_messages')}</h3>
          <p className="text-sm text-muted-foreground">
            {I18n.t('messages.start_conversation')}
          </p>
        </div>
      </div>
    )
  }

  const participant = currentConversation.participants[0]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={participant.user.avatar_url} />
              <AvatarFallback>{participant.user.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>

            <div>
              <h2 className="text-lg font-semibold">{currentConversation.subject}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">
                  with {participant.user.username}
                </span>
                <Badge variant="outline" className="text-xs">
                  {currentConversation.messageable_type}
                </Badge>
                <Badge 
                  variant={
                    currentConversation.status === 'active' ? 'default' :
                    currentConversation.status === 'archived' ? 'secondary' :
                    'outline'
                  }
                  className="text-xs"
                >
                  {I18n.t(`messages.status.${currentConversation.status}`)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleStatusUpdate('archived')}
              disabled={currentConversation.status !== 'active'}
              title={I18n.t('messages.actions.archive')}
            >
              <Archive className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleStatusUpdate('closed')}
              disabled={currentConversation.status === 'closed'}
              title={I18n.t('messages.actions.close')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea 
        ref={scrollAreaRef}
        className="flex-1-- px-6 pt-6 h-[calc(100vh-27rem)]"
        onScroll={handleScroll}
      >
        {messagesLoading && hasMore && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">{I18n.t('messages.loading')}</p>
          </div>
        )}
        
        <AnimatePresence>
          {messages.map((message) => (
            <Message
              key={message.id}
              message={message}
              currentUserId={currentUserId}
            />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Reply Box */}
      {currentConversation.status === 'active' && (
        <div className="border-t p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-4">
            <div className="relative flex-1">
              <Reply className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input
                {...register('message', { required: true })}
                placeholder={I18n.t('messages.reply')}
                className="pl-10"
              />
            </div>
            <Button type="submit">{I18n.t('messages.send')}</Button>
          </form>
        </div>
      )}

      {
        currentConversation.status === 'archived' && (
          <Alert variant={"info"} className="bg-muted">
            <AlertTitle>Conversation Archived</AlertTitle>
            <AlertDescription>
              This conversation 
            </AlertDescription>
          </Alert>
        )
      }
    </div>
  )
}

export default Conversation
