module Api
  module V1
    class TagsController < ApplicationController
      def popular
        tags = Post.published
          .where.not(tags: [])
          .select('unnest(tags) as tag, count(*) as count')
          .group('unnest(tags)')
          .order('count DESC')
          .limit(10)

        render json: tags.map { |tag|
          {
            tag: tag.tag,
            count: tag.count
          }
        }
      end
    end
  end
end
