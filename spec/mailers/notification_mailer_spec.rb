require "rails_helper"

RSpec.describe NotificationMailer, type: :mailer do
  let(:user) { FactoryBot.create(:user) }
  let(:other_user) { FactoryBot.create(:user) }
  let(:track) { FactoryBot.create(:track, user: user, private: false) }

  describe "new_follower" do
    let(:mail) { NotificationMailer.with(follower: other_user, user: user).new_follower }

    it "renders the headers" do
      expect(mail.to).to eq([user.email])
      expect(mail.subject).to include(other_user.username)
    end

    it "renders the body" do
      expect(mail.body.encoded).to match(other_user.username)
    end
  end

  describe "new_comment" do
    let(:comment) { FactoryBot.create(:comment, user: other_user, commentable: track, body: "Great track!") }
    let(:mail) { NotificationMailer.with(commenter: other_user, user: user, comment: comment, commentable: track).new_comment }

    it "renders the headers" do
      expect(mail.to).to eq([user.email])
      expect(mail.subject).to include(other_user.username)
    end

    it "renders the body" do
      expect(mail.body.encoded).to match(other_user.username)
    end
  end

  describe "new_like" do
    let(:mail) { NotificationMailer.with(liker: other_user, user: user, likeable: track).new_like }

    it "renders the headers" do
      expect(mail.to).to eq([user.email])
      expect(mail.subject).to include(other_user.username)
    end

    it "renders the body" do
      expect(mail.body.encoded).to match(other_user.username)
    end
  end

  describe "new_repost" do
    let(:mail) { NotificationMailer.with(reposter: other_user, user: user, track: track).new_repost }

    it "renders the headers" do
      expect(mail.to).to eq([user.email])
      expect(mail.subject).to include(other_user.username)
    end

    it "renders the body" do
      expect(mail.body.encoded).to match(other_user.username)
      expect(mail.body.encoded).to match(track.title)
    end
  end

  describe "new_post" do
    let(:post) { FactoryBot.create(:post, user: other_user, state: "published", private: false, title: "My Article") }
    let(:mail) { NotificationMailer.with(author: other_user, user: user, post: post).new_post }

    it "renders the headers" do
      expect(mail.to).to eq([user.email])
      expect(mail.subject).to include(other_user.username)
    end

    it "renders the body" do
      expect(mail.body.encoded).to match(other_user.username)
      expect(mail.body.encoded).to match(post.title)
    end
  end
end
