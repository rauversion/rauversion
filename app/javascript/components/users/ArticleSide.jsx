import React from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"

export default function ArticleSide({ articles }) {
  if (!articles || articles.length === 0) return null

  return (
    <section className="min-w-0 overflow-hidden bg-default">
      <div className="mx-auto w-full max-w-5xl min-w-0 overflow-hidden">
        <div className="relative min-w-0">
          <Carousel
            opts={{ align: "start", containScroll: "trimSnaps" }}
            className="w-full max-w-full overflow-hidden"
          >
            <div className="mb-4 hidden items-center justify-end gap-3 md:flex">
              <CarouselPrevious className="z-50" />
              <CarouselNext className="z-50" />
            </div>

            <CarouselContent className="-ml-0 md:-ml-4">
              {articles.map((article) => (
                <CarouselItem key={article.id} className="min-w-0 basis-full pl-0 md:basis-1/2 md:pl-4">
                  <div className="h-full min-w-0">
                    <Card className="h-[400px] w-full max-w-full overflow-hidden md:h-[500px]">
                      <CardContent className="flex h-full min-w-0 flex-col p-0">
                        <Link to={`/articles/${article.slug}`} className="block">
                          <div className="relative aspect-[16/9] overflow-hidden">
                            <img
                              src={article.cover_url?.large}
                              alt={article.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </Link>

                        <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
                          <time
                            dateTime={format(new Date(article.created_at), 'yyyy-MM-dd')}
                            className="block break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]"
                          >
                            {format(new Date(article.created_at), 'EEEE, MMMM dd, yyyy')}
                          </time>

                          <h2 className="mt-2 min-w-0 text-lg font-semibold leading-snug text-default">
                            <Link
                              to={`/articles/${article.slug}`}
                              className="block line-clamp-2 break-words transition-colors hover:text-muted [overflow-wrap:anywhere]"
                            >
                              {article.title}
                            </Link>
                          </h2>

                          <p className="mt-4 line-clamp-3 break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">
                            {article.excerpt}
                          </p>

                          <div className="mt-auto border-t border-default/10 pt-4">
                            <Link
                              to={`/${article.user.username}`}
                              className="flex min-w-0 items-center gap-x-2.5 text-sm font-semibold text-default"
                            >
                              <img
                                src={article.user.avatar_url.small}
                                alt={`${article.user.first_name} ${article.user.last_name}`}
                                className="h-6 w-6 flex-none rounded-full bg-muted"
                              />
                              <span className="truncate">
                                {article.user.first_name} {article.user.last_name}
                              </span>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </section>
  )
}
