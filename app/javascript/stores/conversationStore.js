import { create } from 'zustand'
import { get as getReq, post, patch } from '@rails/request.js'

const useConversationStore = create((set, get) => ({
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
      set({ currentConversation: data.conversation, messages: data.conversation.messages, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  appendMessages: async (messages) =>{
    set({ messages: messages, loading: false })
  },

  createConversation: async (data) => {
    set({ loading: true })
    try {
      const response = await post('/conversations.json', {
        body: JSON.stringify({ conversation: data }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const responseData = await response.json
      set(state => ({
        conversations: [...state.conversations, responseData.conversation],
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
        body: JSON.stringify({ message: { body: message } })
      })
      const data = await response.json

      set(state => ({
        messages: [...state.messages, data.message]
      }))
      return data.message
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  updateConversationStatus: async (id, status) => {
    try {
      const response = await post(`/conversations/${id}/${status}.json`)
      const data = await response.json
      set(state => ({
        conversations: state.conversations.map(conv =>
          conv.id === id ? { ...conv, status: status } : conv
        ),
        currentConversation: state.currentConversation?.id === id 
          ? { ...state.currentConversation, status: status }
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
}))

export default useConversationStore
