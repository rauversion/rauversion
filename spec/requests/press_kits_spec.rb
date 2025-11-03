require 'rails_helper'

RSpec.describe 'PressKits', type: :request do
  let(:user) { FactoryBot.create(:user, role: 'artist') }
  let(:other_user) { FactoryBot.create(:user, role: 'artist') }
  
  describe 'GET /show' do
    context 'when press kit does not exist' do
      it 'returns 404 for non-owner' do
        get user_press_kit_path(username: user.username)
        expect(response).to have_http_status(:not_found)
      end
    end
    
    context 'when press kit exists' do
      let!(:press_kit) { user.create_press_kit(bio: 'Test bio', published: true) }
      
      it 'shows published press kit' do
        get user_press_kit_path(username: user.username), headers: { 'Accept' => 'application/json' }
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['bio']).to eq('Test bio')
      end
      
      it 'hides unpublished press kit from non-owners' do
        press_kit.update(published: false)
        get user_press_kit_path(username: user.username), headers: { 'Accept' => 'application/json' }
        expect(response).to have_http_status(:not_found)
      end
    end
  end
  
  describe 'PUT /update' do
    let!(:press_kit) { user.create_press_kit(bio: 'Original bio', published: false) }
    
    context 'when not authenticated' do
      it 'redirects to sign in' do
        put user_press_kit_path(username: user.username), 
            params: { press_kit: { bio: 'Updated bio' } },
            headers: { 'Accept' => 'application/json' }
        expect(response).to have_http_status(:unauthorized)
      end
    end
    
    context 'when authenticated as owner' do
      before { sign_in user }
      
      it 'updates press kit' do
        put user_press_kit_path(username: user.username), 
            params: { press_kit: { bio: 'Updated bio', published: true } },
            headers: { 'Accept' => 'application/json' }
        expect(response).to have_http_status(:success)
        press_kit.reload
        expect(press_kit.bio).to eq('Updated bio')
        expect(press_kit.published).to be true
      end
    end
    
    context 'when authenticated as different user' do
      before { sign_in other_user }
      
      it 'returns forbidden' do
        put user_press_kit_path(username: user.username), 
            params: { press_kit: { bio: 'Updated bio' } },
            headers: { 'Accept' => 'application/json' }
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
  
  describe 'GET /edit' do
    let!(:press_kit) { user.create_press_kit(bio: 'Test bio') }
    
    context 'when not authenticated' do
      it 'redirects to sign in' do
        get edit_user_press_kit_path(username: user.username)
        expect(response).to have_http_status(:found)
      end
    end
    
    context 'when authenticated as owner' do
      before { sign_in user }
      
      it 'shows edit form' do
        get edit_user_press_kit_path(username: user.username)
        expect(response).to have_http_status(:success)
      end
    end
  end
end
