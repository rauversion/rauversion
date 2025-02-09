module Api
  module V1
    class CategoriesController < ApplicationController
      def index
        categories = Category.joins(:posts)
          .where(posts: { state: "published" })
          .select('categories.*, COUNT(posts.id) as posts_count')
          .group('categories.id')
          .order('posts_count DESC')

        render json: categories.map { |category|
          {
            id: category.id,
            name: category.name,
            slug: category.slug,
            posts_count: category.posts_count
          }
        }
      end
    end
  end
end
