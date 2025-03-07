import ConversationsIndex from '../components/messaging/ConversationsIndex'
import NewConversation from '../components/messaging/NewConversation'

const conversationRoutes = [
  {
    path: "conversations",
    children: [
      {
        index: true,
        element: <ConversationsIndex />
      },
      {
        path: "new",
        element: <NewConversation />
      },
      {
        path: ":conversationId",
        element: <ConversationsIndex />
      }
    ]
  }
]

export default conversationRoutes
