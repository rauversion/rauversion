import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { useToast } from '@/hooks/use-toast'
import ConversationList from './ConversationList'
import Conversation from './Conversation'
import useConversationStore from '../../stores/conversationStore'

const NewConversationDialog = ({ messageable, onSuccess }) => {
  const { register, handleSubmit, reset } = useForm()
  const { createConversation } = useConversationStore()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)

  const onSubmit = async (data) => {
    try {
      const conversation = await createConversation({
        subject: data.subject,
        messageable_type: messageable.type,
        messageable_id: messageable.id,
        participant_ids: data.participant_ids ? data.participant_ids.split(',').map(id => parseInt(id.trim())) : []
      })
      reset()
      setOpen(false)
      onSuccess(conversation.id)
      toast({
        title: "Success",
        description: "Conversation created successfully"
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">New Conversation</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start New Conversation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              {...register('subject', { required: true })}
              placeholder="Conversation subject"
            />
          </div>
          <div>
            <Input
              {...register('participant_ids')}
              placeholder="Participant IDs (comma separated)"
            />
          </div>
          <Button type="submit">Create</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const MessagingContainer = ({ 
  currentUserId,
  messageable, // { type: 'Product', id: 1 } or { type: 'User', id: 1 }
  className = ''
}) => {
  const [selectedConversationId, setSelectedConversationId] = useState(null)

  return (
    <div className={`grid grid-cols-12 gap-4 h-[600px] ${className}`}>
      <div className="col-span-4 h-full">
        <div className="flex flex-col h-full gap-4">
          <div className="flex justify-between items-center">
            <NewConversationDialog
              messageable={messageable}
              onSuccess={setSelectedConversationId}
            />
          </div>
          <div className="flex-1">
            <ConversationList
              selectedId={selectedConversationId}
              onSelect={setSelectedConversationId}
            />
          </div>
        </div>
      </div>
      
      <div className="col-span-8 h-full">
        {selectedConversationId ? (
          <Conversation
            conversationId={selectedConversationId}
            currentUserId={currentUserId}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  )
}

export default MessagingContainer
