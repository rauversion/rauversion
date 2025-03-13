import React from 'react'
import { motion } from 'framer-motion'
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import I18n from '@/stores/locales'

const Message = ({ message, currentUserId }) => {
  const isOwn = message.user.id === currentUserId
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.user.avatar_url.small} />
          <AvatarFallback>{message.user.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">{message.user.username}</span>
              {message.message_type === 'system' && (
                <Badge variant="secondary" className="text-xs">System</Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(message.created_at).toLocaleString()}
            </span>
          </div>

          <div className={cn(
            "mt-1 text-sm",
            message.message_type === 'system' && "italic text-muted-foreground"
          )}>
            {message.body}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default Message
