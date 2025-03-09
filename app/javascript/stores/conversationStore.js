import { create } from 'zustand'
import { get as getReq, post } from '@rails/request.js'
import zukeeper from 'zukeeper'

const useConversationStore = create(zukeeper((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  error: null,

  fetchConversations: async () => {
    set({ loading: true })
    try {
      const response = await getReq('/conversations.json')
      const data = await response.json
      set({ conversations: data, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  fetchConversation: async (id) => {
    set({ loading: true })
    try {
      const response = await getReq(`/conversations/${id}.json`)
      const data = await response.json
      set({ 
        currentConversation: data.conversation, 
        // messages: data.conversation.messages || [],
        loading: false 
      })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  setMessages: async (messages)=>{
    set(state => {
      return {...state, messages: messages}
    })
  },

  createConversation: async (data) => {
    set({ loading: true })
    try {
      // First create the conversation
      const response = await post('/conversations.json', {
        body: JSON.stringify({ 
          conversation: {
            subject: data.subject,
            messageable_type: data.messageable_type,
            messageable_id: data.messageable_id
          },
          participant_ids: data.participant_ids
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const responseData = await response.json

      // If initial message is provided, create it
      if (data.initial_message) {
        await post(`/conversations/${responseData.conversation.id}/messages.json`, {
          body: JSON.stringify({ 
            message: { 
              body: data.initial_message 
            } 
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      set(state => ({
        conversations: [responseData.conversation, ...state.conversations],
        loading: false
      }))
      return responseData.conversation
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  sendMessage: async (conversationId, message) => {
    try {
      const response = await post(`/conversations/${conversationId}/messages.json`, {
        body: JSON.stringify({ message: { body: message } }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const data = await response.json
      
      // Update messages and conversation
      set(state => ({
        messages: [...state.messages, data.message],
        conversations: state.conversations.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              last_message: data.message,
              updated_at: new Date().toISOString()
            }
          }
          return conv
        })
      }))
      
      return data.message
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  appendMessage: (message) => {
    set(state => {
      // Don't append if message already exists
      if (state.messages.some(m => m.id === message.id)) {
        return state
      }

      // Update messages array and conversation's last_message
      const conversationId = state.currentConversation?.id
      return {
        messages: [...state.messages, message],
        conversations: state.conversations.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              last_message: message,
              updated_at: message.created_at
            }
          }
          return conv
        })
      }
    })
  },

  appendMessages: (newMessages) => {
    set(state => {
      // Filter out duplicates
      const uniqueMessages = newMessages.filter(
        newMsg => !state.messages.some(msg => msg.id === newMsg.id)
      )
      return {
        messages: [...state.messages, ...uniqueMessages]
      }
    })
  },

  updateConversationStatus: async (id, status) => {
    try {
      const response = await post(`/conversations/${id}/${status}.json`)
      const data = await response.json
      
      set(state => ({
        conversations: state.conversations.map(conv =>
          conv.id === id ? { ...conv, status } : conv
        ),
        currentConversation: state.currentConversation?.id === id 
          ? { ...state.currentConversation, status }
          : state.currentConversation
      }))
      
      return data
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  clearError: () => set({ error: null }),
  clearCurrentConversation: () => set({ currentConversation: null, messages: [] })
})))

window.store = useConversationStore
export default useConversationStore
