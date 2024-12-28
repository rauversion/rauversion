class ArticlesController < ApplicationController
  before_action :authenticate_user!, except: [:index, :show]

  def index
    @articles = Post.published.order("id desc")
      .with_attached_cover
      .includes(user: {avatar_attachment: :blob})

    # Filter by category if present
    if params[:category].present?
      @current_category = Category.friendly.find(params[:category])
      @articles = @articles.where(category: @current_category)
    end

    @articles = @articles.page(params[:page]).per(12)

    # Get all categories with post counts
    @categories = Category.joins(:posts)
      .where(posts: { state: "published" })
      .select('categories.*, COUNT(posts.id) as posts_count')
      .group('categories.id')
      .order('posts_count DESC')

    # Get popular tags from published posts
    @popular_tags = Post.published
      .where.not(tags: [])
      .select('unnest(tags) as tag, count(*) as count')
      .group('unnest(tags)')
      .order('count DESC')
      .limit(10)

    # Latest articles for sidebar
    @latest_articles = Post.published.order("id desc")
      .with_attached_cover
      .includes(user: {avatar_attachment: :blob})
      .page(2).per(7)

    # Featured news section
    @category = Category.friendly.find("news")
    @news = Post.published.friendly
      .where(category_id: @category)
      .with_attached_cover
      .includes(user: {avatar_attachment: :blob})
      .order("id desc").page(1).per(7)

    respond_to do |format|
      format.html
      format.turbo_stream
    end
  end

  def new
    @article = current_user.posts.new
  end

  def show
    @post = Post.published.friendly.find(params[:id])

    set_meta_tags(
      # title: @post.title,
      # description: @post.excerpt,
      keywords: "",
      # url: Routes.articles_show_url(socket, :show, post.id),
      title: "#{@post.title} on Rauversion",
      description: "Read #{@post.title} by #{@post.user.username} on Rauversion.",
      image: @post&.cover_url(:medium),

      og: {
        title: @post.title,
        description: @post.excerpt,
        image: @post&.cover_url(:medium)        
      },

      twitter: {
        card: "summary",
        site: "rauversion.com",
        creator: "@rauversion",
        title: @post.title,
        description: @post.excerpt.truncate(120, separator: ' '),
        "image:src": @post&.cover_url(:medium)
      }
    )
  end

  def preview
    @post = Post.find_signed(params[:id])
    render "show"
  end

  def create
    @article = current_user.posts.create(
      body: params[:post][:body],
      title: params[:post][:title]
    )
    redirect_to edit_article_path(@article), status: :see_other
  end

  def edit
    @article = current_user.posts.friendly.find(params[:id])
    # redirect_to edit_article_path(@article)
  end

  def update
    @article = current_user.posts.friendly.find(params[:id])
    @article.assign_attributes(crop_data: JSON.parse(params[:post][:crop_data])) unless params.dig(:post, :crop_data).blank?
    @article.update(article_params)
    # redirect_to edit_article_path(@article)
    flash.now[:notice] = "aloha!!"
  end

  def mine
    @tab = params[:tab] || "all"
    @posts = case @tab
    when "published"
      current_user.posts.published
    when "draft"
      current_user.posts.draft
    else
      current_user.posts
    end

    @posts.page(params[:page]).per(10)
  end

  private

  def article_params
    params.require(:post).permit(
      :id, 
      :title, 
      :private,
      :cover,
      :category_id, 
      :state, 
      :excerpt, 
      body: {}
    )
  end
end
