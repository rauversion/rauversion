class NotificationMailer < ApplicationMailer
  def new_follower
    @follower = params[:follower]
    @user = params[:user]

    mail(
      to: @user.email,
      subject: t('notification_mailer.new_follower.subject', follower: @follower.username)
    )
  end

  def new_comment
    @commenter = params[:commenter]
    @user = params[:user]
    @comment = params[:comment]
    @commentable = params[:commentable]
    @commentable_url = resource_url(@commentable)
    @commentable_title = resource_title(@commentable)
    @commentable_type = resource_type(@commentable)
    @commentable_cover_url = resource_cover_url(@commentable)

    mail(
      to: @user.email,
      subject: t('notification_mailer.new_comment.subject', commenter: @commenter.username)
    )
  end

  def new_like
    @liker = params[:liker]
    @user = params[:user]
    @likeable = params[:likeable]
    @likeable_url = resource_url(@likeable)
    @likeable_title = resource_title(@likeable)
    @likeable_type = resource_type(@likeable)
    @likeable_cover_url = resource_cover_url(@likeable)

    mail(
      to: @user.email,
      subject: t('notification_mailer.new_like.subject', liker: @liker.username)
    )
  end

  def new_repost
    @reposter = params[:reposter]
    @user = params[:user]
    @track = params[:track]

    mail(
      to: @user.email,
      subject: t('notification_mailer.new_repost.subject', reposter: @reposter.username)
    )
  end

  def new_post
    @author = params[:author]
    @user = params[:user]
    @post = params[:post]

    mail(
      to: @user.email,
      subject: t('notification_mailer.new_post.subject', author: @author.username)
    )
  end

  private

  def resource_url(resource)
    return if resource.blank?

    polymorphic_url(resource)
  rescue StandardError
    nil
  end

  def resource_title(resource)
    return if resource.blank?
    return resource.title if resource.respond_to?(:title) && resource.title.present?

    resource.class.model_name.human
  end

  def resource_type(resource)
    return if resource.blank?

    resource.class.model_name.human
  end

  def resource_cover_url(resource)
    return if resource.blank?
    return unless resource.respond_to?(:cover)
    return unless resource.cover.respond_to?(:attached?)
    return unless resource.cover.attached?

    rails_storage_proxy_url(resource.cover)
  rescue StandardError
    nil
  end
end
