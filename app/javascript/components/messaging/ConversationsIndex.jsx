import React, { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import ConversationList from './ConversationList'
import Conversation from './Conversation'
import NewConversation from './NewConversation'
import useAuthStore from '@/stores/authStore'
import I18n from '@/stores/locales'
import { useParams } from "react-router"

const ConversationsIndex = () => {
  const [selectedConversationId, setSelectedConversationId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const {conversationId} = useParams()
  const { currentUser } = useAuthStore()

  useEffect(()=>{
    setSelectedConversationId(conversationId)
  }, [conversationId])

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">
            {I18n.t('messages.title')}
          </h1>
          <NewConversation />
        </div>

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-19rem)]">
          {/* Sidebar */}
          <div className="col-span-4 flex flex-col border rounded-lg">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={I18n.t('messages.placeholders.search')}
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <ConversationList
              selectedId={selectedConversationId}
              onSelect={setSelectedConversationId}
            />
          </div>

          {/* Main Content */}
          <div className="col-span-8 border rounded-lg">
            {selectedConversationId ? (
              <Conversation
                conversationId={selectedConversationId}
                currentUserId={currentUser.id}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <h3 className="text-lg font-medium">
                    {I18n.t('messages.no_messages')}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {I18n.t('messages.start_conversation')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConversationsIndex
