class ArticlesController < ApplicationController
  before_action :authenticate_user!, except: [:index, :show, :categories, :tags]

  def index
    @articles = Post.published.order("created_at desc")
      .with_attached_cover
      .includes(user: {avatar_attachment: :blob})

    # Filter by category if present
    if params[:category].present?
      @current_category = Category.friendly.find(params[:category])
      @articles = @articles.where(category: @current_category)
    end

    # Filter by tag if present
    if params[:tag].present?
      @articles = @articles.where("tags @> ARRAY[?]::varchar[]", [params[:tag]])
    end

    @articles = @articles.page(params[:page]).per(1)

    if request.headers["Turbo-Frame"]&.include?("articles_list")
      respond_to do |format|
        format.html
        format.turbo_stream
      end and return
    end
   
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
      format.json
      format.turbo_stream
    end
  end

  def new
    @article = current_user.posts.new
  end

  def show
    @post = Post.published.friendly.find(params[:id])

    set_meta_tags(
      keywords: "",
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

    respond_to do |format|
      format.html
      format.json
    end
  end

  def preview
    @post = Post.find_signed(params[:id])
    render "show"
  end

  def create
    @article = current_user.posts.new(article_params)

    respond_to do |format|
      if @article.save
        format.html { redirect_to article_url(@article), notice: "Article was successfully created." }
        format.json { render json: { article: { id: @article.id, slug: @article.slug } }, status: :created }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: { errors: @article.errors }, status: :unprocessable_entity }
      end
    end
  end

  def edit
    @article = current_user.posts.friendly.find(params[:id])
  end

  def update
    @article = current_user.posts.friendly.find(params[:id])
    
    # Handle cover attachment if blob_id is present
    if params.dig(:post, :cover_blob_id).present?
      @article.cover.attach(params[:post][:cover_blob_id])
      
      # Handle crop data if present
      if params.dig(:post, :crop_data).present?
        @article.update(crop_data: params[:post][:crop_data])
      end
    end

    if @article.update(article_params)
      render json: { 
        article: @article.as_json.merge(
          cover_url: @article.cover.attached? ? url_for(@article.cover) : nil
        ) 
      }
    else
      render json: { errors: @article.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    @article = current_user.posts.find(params[:id])
    @article.destroy

    respond_to do |format|
      format.html { redirect_to articles_url, notice: "Article was successfully destroyed." }
      format.json { render json: { article: { id: @article.id, slug: @article.slug } }, status: :ok }
    end
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

    @posts = @posts.page(params[:page]).per(10)
  end

  def categories
    @categories = Category.joins(:posts)
      .where(posts: { state: "published" })
      .select('categories.*, COUNT(posts.id) as posts_count')
      .group('categories.id')
      .order('posts_count DESC')

    respond_to do |format|
      format.json
    end
  end

  def tags
    @popular_tags = Post.published
      .where.not(tags: [])
      .select('unnest(tags) as tag, count(*) as count')
      .group('unnest(tags)')
      .order('count DESC')
      .limit(10)

    respond_to do |format|
      format.json
    end
  end

  private

  def article_params
    params.require(:post).permit(
      :title, 
      :crop_data,
      :excerpt, 
      :private, 
      :state, 
      :category_id,
      tags: [],
      body: {}
    )
  end
end
