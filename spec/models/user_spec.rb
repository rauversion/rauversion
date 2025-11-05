require "rails_helper"

RSpec.describe User, type: :model do
  # Validation tests
  # it { should validate_presence_of(:first_name) }
  it { should validate_presence_of(:email) }
  it { should validate_presence_of(:password) }

  it { should have_many(:tracks) }
  it { should have_many(:playlists) }
  it { should have_many(:reposts) }
  it { should have_many(:reposted_tracks).through(:reposts) }
  it { should have_many(:track_comments) }
  it { should have_many(:posts) }
  it { should have_many(:listening_events) }
  it { should have_many(:invitations) }
  it { should have_many(:oauth_credentials) }
  it { should have_many(:events) }
  it { should have_many(:event_hosts) }
  # it { should have_many(:hosted_events).through(:event_hosts) } #, through: :event_hosts
  it { should have_many(:purchases) }
  it { should have_many(:comments) }

  it { should have_one_attached(:avatar) }

  describe "scopes" do
    before :each do
      @artist_user = FactoryBot.create(:user, role: "artist")
      @non_artist_user = FactoryBot.create(:user, role: "user")
    end

    it "gets artist users" do
      expect(User.artists).to include(@artist_user)
      expect(User.artists).to_not include(@non_artist_user)
    end
  end

  describe "#is_admin?" do
    it "returns true if the user is an admin" do
      admin_user = FactoryBot.create(:user, role: "admin")
      expect(admin_user.is_admin?).to be true
    end

    it "returns false if the user is not an admin" do
      non_admin_user = FactoryBot.create(:user, role: "user")
      expect(non_admin_user.is_admin?).to be false
    end
  end

  describe "#is_creator?" do
    it "returns true if the user is an artist" do
      artist_user = FactoryBot.create(:user, username: "artist", role: "artist")
      expect(artist_user.is_creator?).to be true
    end

    it "returns true if the user is an admin" do
      admin_user = FactoryBot.create(:user, username: "admin", role: "admin")
      expect(admin_user.is_creator?).to be true
    end

    it "returns false if the user is not an artist or admin" do
      user = FactoryBot.create(:user, username: "user", role: "user")
      expect(user.is_creator?).to be false
    end

    it "returns false if the user does not have a username" do
      user = FactoryBot.create(:user, username: nil, role: "artist")
      expect(user.is_creator?).to be false
    end
  end

  describe "#unread_messages_count" do
    it "returns 0 when user has no conversations" do
      user = FactoryBot.create(:user)
      expect(user.unread_messages_count).to eq(0)
    end

    it "returns the count of unread messages for the user" do
      user1 = FactoryBot.create(:user)
      user2 = FactoryBot.create(:user)
      
      # Create a conversation with both users
      conversation = FactoryBot.create(:conversation)
      participant1 = FactoryBot.create(:participant, user: user1, conversation: conversation)
      participant2 = FactoryBot.create(:participant, user: user2, conversation: conversation)
      
      # User2 sends 3 messages to the conversation
      3.times do
        FactoryBot.create(:message, conversation: conversation, user: user2)
      end
      
      # User1 should have 3 unread messages
      expect(user1.unread_messages_count).to eq(3)
      
      # User2 should have 0 unread messages (they sent them)
      expect(user2.unread_messages_count).to eq(0)
    end

    it "does not count messages that have been read" do
      user1 = FactoryBot.create(:user)
      user2 = FactoryBot.create(:user)
      
      conversation = FactoryBot.create(:conversation)
      participant1 = FactoryBot.create(:participant, user: user1, conversation: conversation)
      participant2 = FactoryBot.create(:participant, user: user2, conversation: conversation)
      
      # User2 sends 2 messages
      message1 = FactoryBot.create(:message, conversation: conversation, user: user2)
      message2 = FactoryBot.create(:message, conversation: conversation, user: user2)
      
      # User1 should have 2 unread messages
      expect(user1.unread_messages_count).to eq(2)
      
      # Mark first message as read by user1
      FactoryBot.create(:message_read, message: message1, participant: participant1)
      
      # User1 should now have 1 unread message
      expect(user1.unread_messages_count).to eq(1)
    end
  end
end
