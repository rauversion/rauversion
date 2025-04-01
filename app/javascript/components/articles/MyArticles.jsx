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
import { post, destroy } from '@rails/request.js'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import I18n from '@/stores/locales'

const formSchema = z.object({
  title: z.string().min(2, {
    message: I18n.t('articles.mine.form.validation.title_min'),
  }),
})

function getStatusBadge(status_raw) {
  const status = status_raw ? status_raw.toLowerCase() : "draft"
  switch(status) {
    case 'published':
      return (
        <Badge variant="success" className="capitalize">
          {I18n.t(`articles.mine.status.${status}`)}
        </Badge>
      )
    case 'draft':
      return (
        <Badge variant="warning" className="capitalize">
          {I18n.t(`articles.mine.status.${status}`)}
        </Badge>
      )
    default:
      return (
        <Badge variant="secondary" className="capitalize">
          {I18n.t(`articles.mine.status.${status}`)}
        </Badge>
      )
  }
}

export default function MyArticles() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [deleteDialog, setDeleteDialog] = React.useState({ open: false, article: null })
  const [tab, setTab] = React.useState('all')
  const {
    items: posts,
    setPosts,
    loading,
    lastElementRef,
    setItems,
    resetList
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
          title: I18n.t('articles.mine.messages.save_success'),
          description: I18n.t('articles.mine.messages.save_success'),
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
        title: I18n.t('articles.mine.messages.save_error'),
        description: I18n.t('articles.mine.messages.save_error'),
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    const article = deleteDialog.article
    try {
      const response = await destroy(`/articles/${article.id}.json`)
      if (response.ok) {
        const { article: deletedArticle } = await response.json
        setItems(posts.filter(p => p.id !== deletedArticle.id))
        toast({
          title: I18n.t('articles.mine.messages.delete_success'),
          description: I18n.t('articles.mine.messages.delete_success'),
        })
      } else {
        toast({
          title: I18n.t('articles.mine.messages.delete_error'),
          description: I18n.t('articles.mine.messages.delete_error'),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting article:', error)
      toast({
        title: I18n.t('articles.mine.messages.delete_error'),
        description: I18n.t('articles.mine.messages.delete_error'),
        variant: "destructive",
      })
    } finally {
      setDeleteDialog({ open: false, article: null })
    }
  }

  // if (loading && !posts.length) return <div>{I18n.t('articles.mine.loading.initial')}</div>
  if (!posts) return null

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-6 my-4">
        <Tabs defaultValue={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">{I18n.t('articles.mine.tabs.all')}</TabsTrigger>
            <TabsTrigger value="draft">{I18n.t('articles.mine.tabs.drafts')}</TabsTrigger>
            <TabsTrigger value="published">{I18n.t('articles.mine.tabs.published')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-default">
            {I18n.t('articles.mine.title')}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {I18n.t('articles.mine.subtitle')}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button asChild>
              <Button variant="outline">{I18n.t('articles.mine.new_article')}</Button>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{I18n.t('articles.mine.new_article')}</DialogTitle>
                <DialogDescription>
                  {I18n.t('articles.mine.form.title.placeholder')}
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{I18n.t('articles.mine.form.title.label')}</FormLabel>
                        <FormControl>
                          <Input placeholder={I18n.t('articles.mine.form.title.placeholder')} {...field} />
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
                      {I18n.t('sharer.cancel')}
                    </Button>
                    <Button type="submit">
                      {I18n.t('articles.create')}
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
                <TableHead>{I18n.t('articles.mine.table.title')}</TableHead>
                <TableHead>{I18n.t('articles.by')}</TableHead>
                <TableHead>{I18n.t('articles.mine.table.status')}</TableHead>
                <TableHead className="text-right">{I18n.t('articles.mine.table.actions')}</TableHead>
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
                      {post.title || I18n.t('events.my_events.untitled')}
                    </Link>
                  </TableCell>
                  <TableCell>{post.user.username}</TableCell>
                  <TableCell>{getStatusBadge(post.state)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">{I18n.t('articles.mine.table.menu.open')}</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{I18n.t('articles.mine.table.actions')}</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link to={`/articles/${post.slug}/edit`}>
                            {I18n.t('articles.mine.table.menu.edit')}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/articles/${post.signed_id}/preview`}>
                            {I18n.t('articles.mine.buttons.preview')}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => setDeleteDialog({ open: true, article: post })}
                        >
                          {I18n.t('articles.mine.table.menu.delete')}
                        </DropdownMenuItem>
                        {post.slug && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link to={`/articles/${post.slug}`}>
                                {I18n.t('articles.mine.table.menu.view')}
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
            {I18n.t('articles.mine.loading.more')}
          </div>
        )}
      </div>
      <AlertDialog 
        open={deleteDialog.open} 
        onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{I18n.t('articles.mine.messages.delete_confirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {I18n.t('articles.mine.messages.delete_error')}
              {deleteDialog.article && ` "${deleteDialog.article.title}"`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{I18n.t('sharer.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {I18n.t('articles.mine.buttons.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
