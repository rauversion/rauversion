import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
import { post } from '@rails/request.js'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
})

function getStatusBadge(status_raw) {
  const status = status_raw ? status_raw.toLowerCase() : "draft"
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
  const navigate = useNavigate()
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [tab, setTab] = React.useState('all')
  const {
    items: posts,
    loading,
    lastElementRef
  } = useInfiniteScroll(`/articles/mine.json?tab=${tab}`)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
    },
  })

  const onSubmit = async (data) => {
    try {
      const response = await post('/articles.json', {
        body: JSON.stringify({
          post: {
            title: data.title,
            state: 'draft'
          }
        }),
        responseKind: 'json'
      })

      if (response.ok) {
        const { article } = await response.json
        toast({
          title: "Éxito",
          description: "Artículo creado correctamente",
        })
        setOpen(false)
        navigate(`/articles/${article.slug}/edit`)
      } else {
        const { errors } = await response.json
        Object.keys(errors).forEach((key) => {
          form.setError(key, {
            type: 'manual',
            message: errors[key][0]
          })
        })
      }
    } catch (error) {
      console.error('Error creating article:', error)
      toast({
        title: "Error",
        description: "No se pudo crear el artículo",
        variant: "destructive",
      })
    }
  }

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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button asChild>
              <Button variant="outline">New Article</Button>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Article</DialogTitle>
                <DialogDescription>
                  Enter the title of your new article. You can edit it later.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="My new article" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      Create
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
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
