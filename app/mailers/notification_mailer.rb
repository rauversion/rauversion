class NotificationMailer < ApplicationMailer
  def new_follower
    @follower = params[:follower]
    @user = params[:user]

    mail(
      to: @user.email,
      subject: t('mailers.notification.new_follower.subject', follower: @follower.username)
    )
  end

  def new_comment
    @commenter = params[:commenter]
    @user = params[:user]
    @comment = params[:comment]
    @commentable = params[:commentable]

    mail(
      to: @user.email,
      subject: t('mailers.notification.new_comment.subject', commenter: @commenter.username)
    )
  end

  def new_like
    @liker = params[:liker]
    @user = params[:user]
    @likeable = params[:likeable]

    mail(
      to: @user.email,
      subject: t('mailers.notification.new_like.subject', liker: @liker.username)
    )
  end

  def new_repost
    @reposter = params[:reposter]
    @user = params[:user]
    @track = params[:track]

    mail(
      to: @user.email,
      subject: t('mailers.notification.new_repost.subject', reposter: @reposter.username)
    )
  end

  def new_post
    @author = params[:author]
    @user = params[:user]
    @post = params[:post]

    mail(
      to: @user.email,
      subject: t('mailers.notification.new_post.subject', author: @author.username)
    )
  end
end
