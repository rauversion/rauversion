import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useToast } from '@/hooks/use-toast'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import useConversationStore from '../../stores/conversationStore'

const NewConversation = ({ currentUserId }) => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { register, handleSubmit, formState: { errors } } = useForm()
  const { createConversation } = useConversationStore()

  const onSubmit = async (data) => {
    try {
      const conversation = await createConversation({
        subject: data.subject,
        participant_ids: data.participant_ids.split(',').map(id => parseInt(id.trim())).filter(Boolean),
        messageable_type: 'User',
        messageable_id: currentUserId,
        initial_message: data.message
      })

      toast({
        title: "Success",
        description: "Conversation created successfully"
      })

      navigate(`/conversations/${conversation.id}`)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      })
    }
  }

  return (
    <div className="container max-w-2xl py-8">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">New Conversation</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              {...register('subject', { required: "Subject is required" })}
              placeholder="Enter conversation subject"
            />
            {errors.subject && (
              <p className="text-sm text-destructive">{errors.subject.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="participant_ids">
              Participants (User IDs, comma separated)
            </Label>
            <Input
              id="participant_ids"
              {...register('participant_ids', { required: "At least one participant is required" })}
              placeholder="e.g., 1, 2, 3"
            />
            {errors.participant_ids && (
              <p className="text-sm text-destructive">{errors.participant_ids.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Initial Message</Label>
            <Textarea
              id="message"
              {...register('message', { required: "Initial message is required" })}
              placeholder="Type your first message..."
              rows={4}
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message.message}</p>
            )}
          </div>

          <div className="flex gap-4">
            <Button type="submit">Create Conversation</Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate('/conversations')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default NewConversation
