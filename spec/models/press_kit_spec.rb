require 'rails_helper'

RSpec.describe PressKit, type: :model do
  describe 'associations' do
    it { should belong_to(:user) }
  end
  
  describe 'validations' do
    let(:user) { FactoryBot.create(:user) }
    let(:press_kit) { FactoryBot.build(:press_kit, user: user) }
    
    it 'validates uniqueness of user_id' do
      press_kit.save
      duplicate_press_kit = FactoryBot.build(:press_kit, user: user)
      expect(duplicate_press_kit).not_to be_valid
      expect(duplicate_press_kit.errors[:user_id]).to include('has already been taken')
    end
  end
  
  describe 'scopes' do
    let(:user) { FactoryBot.create(:user) }
    let!(:published_kit) { FactoryBot.create(:press_kit, user: user, published: true) }
    let!(:draft_kit) { FactoryBot.create(:press_kit, user: FactoryBot.create(:user), published: false) }
    
    describe '.published' do
      it 'returns only published press kits' do
        expect(PressKit.published).to include(published_kit)
        expect(PressKit.published).not_to include(draft_kit)
      end
    end
  end
  
  describe 'store attributes' do
    let(:press_kit) { FactoryBot.build(:press_kit) }
    
    it 'stores video_urls as an array' do
      press_kit.video_urls = ['https://youtube.com/watch?v=123', 'https://vimeo.com/456']
      expect(press_kit.video_urls).to eq(['https://youtube.com/watch?v=123', 'https://vimeo.com/456'])
    end
    
    it 'stores featured_track_ids as an array' do
      press_kit.featured_track_ids = [1, 2, 3]
      expect(press_kit.featured_track_ids).to eq([1, 2, 3])
    end
    
    it 'stores featured_playlist_ids as an array' do
      press_kit.featured_playlist_ids = [4, 5, 6]
      expect(press_kit.featured_playlist_ids).to eq([4, 5, 6])
    end
  end
end
