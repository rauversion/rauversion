import React, { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { motion, AnimatePresence } from 'framer-motion'
import useConversationStore from '../../stores/conversationStore'

const Message = ({ message, currentUserId }) => {
  const isOwn = message.user.id === currentUserId
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 max-w-[80%]`}>
        <Avatar className="w-8 h-8">
          <AvatarImage src={message.user.avatar_url} />
          <AvatarFallback>{message.user.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          <div className={`
            px-4 py-2 rounded-lg
            ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'}
            ${message.message_type === 'system' ? 'bg-secondary text-secondary-foreground italic' : ''}
          `}>
            {message.body}
          </div>
          <span className="text-xs text-muted-foreground mt-1">
            {new Date(message.created_at).toLocaleTimeString()}
          </span>
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
    currentConversation,
    messages,
    loading,
    error,
    fetchConversation,
    sendMessage,
    updateConversationStatus
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
    return <div className="flex items-center justify-center h-full">Loading...</div>
  }

  if (!currentConversation) {
    return <div className="flex items-center justify-center h-full">No conversation selected</div>
  }

  const canManage = currentConversation.participants.some(
    p => p.user.id === currentUserId && ['owner', 'admin'].includes(p.role)
  )

  return (
    <Card className="flex flex-col h-full">
      <div className="p-4 border-b flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">{currentConversation.subject}</h2>
          <p className="text-sm text-muted-foreground">
            {currentConversation.participants.length} participants • 
            Status: {currentConversation.status}
          </p>
        </div>
        
        {canManage && currentConversation.status === 'active' && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleStatusUpdate('archived')}
            >
              Archive
            </Button>
            <Button
              variant="outline"
              onClick={() => handleStatusUpdate('closed')}
            >
              Close
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
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

      {currentConversation.status === 'active' && (
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              {...register('message', { required: true })}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button type="submit">Send</Button>
          </div>
        </form>
      )}
    </Card>
  )
}

export default Conversation
