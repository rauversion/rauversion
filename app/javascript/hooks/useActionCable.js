import { useEffect, useCallback } from 'react'
import { createConsumer } from '@rails/actioncable'
import { useCableStore } from '@/stores/cableStore'
import { useToast } from '@/hooks/use-toast'

export const useActionCable = () => {
  const { toast } = useToast()
  
  const { cable, setCable, setSubscription, removeSubscription, reset } = useCableStore()

  useEffect(() => {
    if (!cable) {
      const newCable = createConsumer()
      setCable(newCable)

      return () => {
        newCable.disconnect()
        reset()
      }
    }
  }, [])

    //}, [cable, setCable, reset])

  const subscribe = useCallback((channel, params = {}, callbacks = {}) => {
    
    console.log("SUBSCRIBEEE")
    if (!cable) return
    
    const subscription = cable.subscriptions.create(
      { channel, ...params },
      {
        connected() {
          console.log(`Connected to ${channel}`)
          callbacks.connected?.()
        },

        disconnected() {
          console.log(`Disconnected from ${channel}`)
          callbacks.disconnected?.()
        },

        rejected() {
          console.log(`Rejected from ${channel}`)
          toast({
            title: "Connection Error",
            description: `Failed to connect to ${channel}`,
            variant: "destructive"
          })
          callbacks.rejected?.()
        },

        received(data) {
          console.log(`Received data from ${channel}:`, data)
          callbacks.received?.(data)
        }
      }
    )

    setSubscription(channel, subscription)
    return subscription
  }, [cable, setSubscription])

  const unsubscribe = useCallback((channel) => {
    const subscription = useCableStore.getState().subscriptions[channel]
    if (subscription) {
      subscription.unsubscribe()
      removeSubscription(channel)
    }
  }, [removeSubscription])

  const perform = useCallback((channel, action, data = {}) => {
    const subscription = useCableStore.getState().subscriptions[channel]
    if (subscription) {
      subscription.perform(action, data)
    } else {
      console.warn(`No subscription found for channel: ${channel}`)
    }
  }, [])

  return {
    subscribe,
    unsubscribe,
    perform,
    cable
  }
}

// Example usage:
/*
const YourComponent = () => {
  const { subscribe, unsubscribe, perform } = useActionCable()

  useEffect(() => {
    const subscription = subscribe('ChatChannel', 
      { room: 'general' },
      {
        connected: () => {
          console.log('Connected to chat!')
        },
        received: (data) => {
          console.log('Received message:', data)
        }
      }
    )

    return () => {
      unsubscribe('ChatChannel')
    }
  }, [subscribe, unsubscribe])

  const sendMessage = () => {
    perform('ChatChannel', 'speak', { message: 'Hello!' })
  }

  return <div>Chat Component</div>
}
*/
