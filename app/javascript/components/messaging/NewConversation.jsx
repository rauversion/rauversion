import React from 'react'
import { useForm } from 'react-hook-form'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'
import useConversationStore from '../../stores/conversationStore'
import I18n from '@/stores/locales'

const NewConversation = () => {
  const { toast } = useToast()
  const { register, handleSubmit, reset } = useForm()
  const { createConversation } = useConversationStore()
  const [open, setOpen] = React.useState(false)

  const onSubmit = async (data) => {
    try {
      await createConversation({
        subject: data.subject,
        initial_message: data.message,
        participant_ids: data.participants?.split(',').map(id => id.trim()) || []
      })

      toast({
        title: I18n.t('messages.notifications.created')
      })

      reset()
      setOpen(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: I18n.t('messages.error'),
        description: I18n.t('messages.notifications.error.create')
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {I18n.t('messages.new_message')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{I18n.t('messages.new_message')}</DialogTitle>
          <DialogDescription>
            {I18n.t('messages.start_conversation')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              {...register('subject', { required: true })}
              placeholder={I18n.t('messages.placeholders.subject')}
            />
          </div>
          <div className="space-y-2">
            <Input
              {...register('participants')}
              placeholder={I18n.t('messages.placeholders.participants')}
            />
          </div>
          <div className="space-y-2">
            <Textarea
              {...register('message', { required: true })}
              placeholder={I18n.t('messages.placeholders.message')}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {I18n.t('messages.cancel')}
            </Button>
            <Button type="submit">
              {I18n.t('messages.create_conversation')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default NewConversation
