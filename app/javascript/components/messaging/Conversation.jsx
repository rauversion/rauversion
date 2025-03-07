import React, { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { motion, AnimatePresence } from 'framer-motion'
import { Reply, MoreHorizontal, Archive, Trash2 } from 'lucide-react'
import useConversationStore from '@/stores/conversationStore'
import cn from "classnames"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"

const Message = ({ message, currentUserId }) => {
  const isOwn = message.user.id === currentUserId
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.user.avatar_url} />
          <AvatarFallback>{message.user.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">{message.user.username}</span>
              {message.message_type === 'system' && (
                <Badge variant="secondary" className="text-xs">System</Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(message.created_at).toLocaleString()}
            </span>
          </div>

          <div className={cn(
            "mt-1 text-sm",
            message.message_type === 'system' && "italic text-muted-foreground"
          )}>
            {message.body}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const Conversation = ({ conversationId, currentUserId }) => {
  const { toast } = useToast()
  const messagesEndRef = useRef(null)
  const { register, handleSubmit, reset } = useForm()
  
  const {
    items: messagesPaginated,
    loading,
    lastElementRef,
    resetList
  } = useInfiniteScroll(`/conversations/${conversationId}/messages.json`)

  const {
    currentConversation,
    messages,
    // loading,
    error,
    fetchConversation,
    sendMessage,
    updateConversationStatus,
    appendMessages
  } = useConversationStore()

  useEffect(() => {
    if (conversationId) {
      fetchConversation(conversationId)
    }
  }, [conversationId])

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error
      })
    }
  }, [error])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(()=> {
    appendMessages(messagesPaginated)
  }, [messagesPaginated])

  const onSubmit = async (data) => {
    try {
      await sendMessage(conversationId, data.message)
      reset()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error sending message",
        description: error.message
      })
    }
  }

  const handleStatusUpdate = async (status) => {
    try {
      await updateConversationStatus(conversationId, status)
      toast({
        title: "Status Updated",
        description: `Conversation ${status} successfully`
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating status",
        description: error.message
      })
    }
  }

  if (loading && !currentConversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    )
  }

  if (!currentConversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-medium">No conversation selected</h3>
          <p className="text-sm text-muted-foreground">
            Choose a conversation from the sidebar or start a new one
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
                  {currentConversation.status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleStatusUpdate('archived')}
            >
              <Archive className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleStatusUpdate('closed')}
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
      <ScrollArea className="flex-1 p-6">
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
                placeholder="Type your reply..."
                className="pl-10"
              />
            </div>
            <Button type="submit">Send</Button>
          </form>
        </div>
      )}
    </div>
  )
}

export default Conversation
