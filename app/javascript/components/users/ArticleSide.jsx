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
    <div className="bg-default">
      
      <div className="mx-auto- max-w-[33rem] lg:max-w-[58rem]  px-4- sm:px-6. lg:px-8-">
        <div className="relative">
          <Carousel className="w-full">

          <div className="hidden md:block space-x-3">
            <CarouselPrevious className="z-50" />
            <CarouselNext className="z-50" />
          </div>

            <CarouselContent className="-ml-2 sm:-ml-4">
              {articles.map((article) => (
                <CarouselItem key={article.id} className="pl-2 sm:pl-4 basis-full md:basis-1/2">
                  <div className="h-full">
                    <Card className="h-[400px] md:h-[500px]">
                    <CardContent className="flex flex-col p-0 h-full">
                      <div className="relative aspect-[16/9] overflow-hidden rounded-t-lg">
                        <img
                          src={article.cover_url?.large}
                          alt={article.title}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="p-6 flex flex-col flex-grow">
                        <time 
                          dateTime={format(new Date(article.created_at), 'yyyy-MM-dd')}
                          className="block text-sm leading-6 text-muted"
                        >
                          {format(new Date(article.created_at), 'EEEE, MMMM dd, yyyy')}
                        </time>
                        <h2 className="mt-2 text-lg font-semibold text-default group-hover:text-muted line-clamp-2">
                          <Link to={`/articles/${article.slug}`} className="hover:text-muted transition-colors">
                            {article.title}
                          </Link>
                        </h2>
                        <div className="relative mt-4 flex-grow">
                          <p className="text-sm leading-6 text-muted h-[72px] overflow-hidden">
                            {article.excerpt}
                          </p>
                          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent" />
                        </div>
                        <div className="mt-4 pt-4 border-t border-default/10">
                          <Link 
                            to={`/${article.user.username}`}
                            className="flex items-center gap-x-2.5 text-sm font-semibold text-default"
                          >
                            <img 
                              src={article.user.avatar_url.small} 
                              alt={`${article.user.first_name} ${article.user.last_name}`}
                              className="h-6 w-6 flex-none rounded-full bg-muted" 
                            />
                            {article.user.first_name} {article.user.last_name}
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
    </div>
  )
}
