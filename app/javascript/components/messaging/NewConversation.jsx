import React, { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import Select from 'react-select/async'
import { get } from '@rails/request.js'
import { useDebounce } from '@/hooks/use_debounce'
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

const selectStyles = {
  control: (base) => ({
    ...base,
    backgroundColor: 'hsl(var(--background))',
    borderColor: 'hsl(var(--border))',
    '&:hover': {
      borderColor: 'hsl(var(--border))'
    }
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: 'hsl(var(--background))',
    borderColor: 'hsl(var(--border))'
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? 'hsl(var(--accent))' : 'transparent',
    color: state.isFocused ? 'hsl(var(--accent-foreground))' : 'inherit',
    '&:hover': {
      backgroundColor: 'hsl(var(--accent))',
      color: 'hsl(var(--accent-foreground))'
    }
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: 'hsl(var(--accent))',
    color: 'hsl(var(--accent-foreground))'
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: 'hsl(var(--accent-foreground))'
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: 'hsl(var(--accent-foreground))',
    '&:hover': {
      backgroundColor: 'hsl(var(--destructive))',
      color: 'hsl(var(--destructive-foreground))'
    }
  })
}

const NewConversation = () => {
  const { toast } = useToast()
  const { register, handleSubmit, reset, control } = useForm()
  const { createConversation } = useConversationStore()
  const [open, setOpen] = React.useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const loadOptions = async (inputValue) => {
    if (inputValue.length < 2) return []
    setIsSearching(true)
    try {
      const response = await get('/account_connections/user_search.json', {
        query: { q: inputValue }
      })
      const data = await response.json
      return (data.collection || []).map(user => ({
        value: user.id,
        label: user.username,
        avatar: user.avatar_url?.medium
      }))
    } catch (error) {
      console.error('Error searching users:', error)
      return []
    } finally {
      setIsSearching(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      await createConversation({
        subject: data.subject,
        initial_message: data.message,
        participant_ids: data.participants?.map(p => p.value) || []
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
      <DialogContent>
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
            <Controller
              name="participants"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  isMulti
                  loadOptions={loadOptions}
                  isLoading={isSearching}
                  placeholder={I18n.t('messages.placeholders.participants')}
                  styles={selectStyles}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  noOptionsMessage={() => I18n.t('messages.no_participants_found')}
                  formatOptionLabel={option => (
                    <div className="flex items-center gap-2">
                      {option.avatar && (
                        <img 
                          src={option.avatar} 
                          alt={option.label} 
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <span>{option.label}</span>
                    </div>
                  )}
                />
              )}
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
