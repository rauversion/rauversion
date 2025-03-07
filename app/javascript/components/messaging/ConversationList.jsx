import React, { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import useConversationStore from '../../stores/conversationStore'

const ConversationItem = ({ conversation, isSelected, onClick }) => {
  const lastMessage = conversation.last_message

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Button
        variant={isSelected ? "secondary" : "ghost"}
        className={`w-full justify-start p-3 mb-1 ${isSelected ? 'bg-secondary' : ''}`}
        onClick={onClick}
      >
        <div className="flex flex-col items-start gap-1 w-full">
          <div className="flex justify-between items-center w-full">
            <span className="font-medium truncate">{conversation.subject}</span>
            <Badge variant={
              conversation.status === 'active' ? 'default' :
              conversation.status === 'archived' ? 'secondary' :
              'outline'
            }>
              {conversation.status}
            </Badge>
          </div>
          
          {lastMessage && (
            <div className="flex flex-col gap-1 w-full">
              <p className="text-sm text-muted-foreground truncate">
                {lastMessage.user.username}: {lastMessage.body}
              </p>
              <span className="text-xs text-muted-foreground">
                {new Date(lastMessage.created_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </Button>
    </motion.div>
  )
}

const ConversationList = ({ selectedId, onSelect }) => {
  const { conversations, loading, error, fetchConversations } = useConversationStore()

  useEffect(() => {
    fetchConversations()
  }, [])
  

  if (loading && conversations.length === 0) {
    return <div className="flex items-center justify-center h-full">Loading...</div>
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        Error: {error}
      </div>
    )
  }

  return (
    <Card className="h-full">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">Conversations</h2>
      </div>
      
      <ScrollArea className="h-[calc(100%-4rem)]">
        <div className="p-2">
          {conversations.length === 0 ? (
            <div className="text-center text-muted-foreground p-4">
              No conversations yet
            </div>
          ) : (
            conversations.map((conversation) => (
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
    </Card>
  )
}

export default ConversationList
