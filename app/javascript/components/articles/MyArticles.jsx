import React from 'react'
import { Link } from 'react-router-dom'
import {useInfiniteScroll} from '../../hooks/useInfiniteScroll'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"

function getStatusBadge(status_raw) {
  const status = status_raw.toLowerCase()
  switch(status) {
    case 'published':
      return (
        <Badge variant="success" className="capitalize">
          {status}
        </Badge>
      )
    case 'draft':
      return (
        <Badge variant="warning" className="capitalize">
          {status}
        </Badge>
      )
    default:
      return (
        <Badge variant="secondary" className="capitalize">
          {status}
        </Badge>
      )
  }
}

export default function MyArticles() {
  const [tab, setTab] = React.useState('all')
  const {
    items: posts,
    loading,
    lastElementRef
  } = useInfiniteScroll(`/articles/mine.json?tab=${tab}`)

  if (loading && !posts.length) return <div>Loading...</div>
  if (!posts) return null

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-6 my-4">
        <Tabs defaultValue={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All Articles</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-default">
            {tab.charAt(0).toUpperCase() + tab.slice(1)} Articles
          </h1>
          <p className="mt-2 text-sm text-muted">
            Your articles.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button asChild>
            <Link to="/articles/new">
              New Article
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            
              {posts.map((post, index) => (
                <TableRow 
                  key={post.id} 
                  ref={index === posts.length - 1 ? lastElementRef : null}
                >
                  <TableCell className="font-medium">
                    <Link 
                      to={`/articles/${post.slug}/edit`}
                      className="w-56 truncate hover:text-primary hover:underline block"
                    >
                      {post.title || "-- untitled"}
                    </Link>
                  </TableCell>
                  <TableCell>{post.user.username}</TableCell>
                  <TableCell>{getStatusBadge(post.state)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link to={`/articles/${post.slug}/edit`}>
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/articles/preview/${post.signed_id}`}>
                            Preview
                          </Link>
                        </DropdownMenuItem>
                        {post.slug && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link to={`/articles/${post.slug}`}>
                                View
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {loading && posts.length > 0 && (
          <div className="py-4 text-center text-muted">
            Loading more articles...
          </div>
        )}
      </div>
    </div>
  )
}
