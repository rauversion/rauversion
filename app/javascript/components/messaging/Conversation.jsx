import React, { useEffect, useRef, useCallback, useState } from 'react'
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
import { Reply, MoreHorizontal, Archive, Trash2, Users, Settings, Image, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useConversationStore from '../../stores/conversationStore'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import Message from './Message'
import I18n from '@/stores/locales'

const Conversation = ({ conversationId, currentUserId }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
    setMessages,
    markAsRead
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
            if (data.type === 'new_message') {
              appendMessage(data.message)
              markAsRead(data.message)
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
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  {sidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] p-0">
                <Tabs defaultValue="participants" className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="participants">
                      <Users className="h-4 w-4 mr-2" />
                      Participants
                    </TabsTrigger>
                    <TabsTrigger value="settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </TabsTrigger>
                    <TabsTrigger value="media">
                      <Image className="h-4 w-4 mr-2" />
                      Media
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="participants" className="flex-1">
                    <ScrollArea className="h-[calc(100vh-8rem)] p-4">
                      <div className="space-y-4">
                        {currentConversation.participants.map((participant) => (
                          <div key={participant.id} className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={participant.user.avatar_url} />
                              <AvatarFallback>{participant.user.username[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{participant.user.username}</p>
                              <p className="text-sm text-muted-foreground">{participant.role}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="settings" className="flex-1">
                    <ScrollArea className="h-[calc(100vh-8rem)] p-4">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium mb-2">Conversation Status</h3>
                          <div className="flex gap-2">
                            <Button 
                              variant={currentConversation.status === 'active' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleStatusUpdate('active')}
                              disabled={currentConversation.status === 'active'}
                            >
                              Active
                            </Button>
                            <Button 
                              variant={currentConversation.status === 'archived' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleStatusUpdate('archived')}
                              disabled={currentConversation.status === 'archived'}
                            >
                              Archive
                            </Button>
                            <Button 
                              variant={currentConversation.status === 'closed' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleStatusUpdate('closed')}
                              disabled={currentConversation.status === 'closed'}
                            >
                              Close
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-medium mb-2">Conversation Type</h3>
                          <Badge variant="outline">
                            {currentConversation.messageable_type}
                          </Badge>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="media" className="flex-1">
                    <ScrollArea className="h-[calc(100vh-8rem)] p-4">
                      <div className="text-center text-muted-foreground">
                        <Image className="h-8 w-8 mx-auto mb-2" />
                        <p>No media files in this conversation yet</p>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </SheetContent>
            </Sheet>
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
