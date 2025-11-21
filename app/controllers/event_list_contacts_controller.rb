class EventListContactsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_event
  before_action :check_event_owner
  before_action :set_event_list
  before_action :set_event_list_contact, only: [:show, :update, :destroy]

  def index
    @collection = @event_list.event_list_contacts.order(created_at: :desc).page(params[:page]).per(20)
    respond_to do |format|
      format.json
    end
  end

  def show
    respond_to do |format|
      format.json { render json: @contact }
    end
  end

  def create
    @contact = @event_list.event_list_contacts.new(contact_params)
    
    if @contact.save
      respond_to do |format|
        format.json { render json: @contact, status: :created }
      end
    else
      respond_to do |format|
        format.json { render json: { errors: @contact.errors.full_messages }, status: :unprocessable_entity }
      end
    end
  end

  def update
    if @contact.update(contact_params)
      respond_to do |format|
        format.json { render json: @contact }
      end
    else
      respond_to do |format|
        format.json { render json: { errors: @contact.errors.full_messages }, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @contact.destroy
    respond_to do |format|
      format.json { head :no_content }
    end
  end

  private

  def set_event
    @event = Event.friendly.find(params[:event_id])
  end

  def check_event_owner
    unless @event.user_id == current_user.id
      respond_to do |format|
        format.json { render json: { errors: ['Unauthorized'] }, status: :unauthorized }
      end
    end
  end

  def set_event_list
    @event_list = @event.event_lists.find(params[:event_list_id])
  end

  def set_event_list_contact
    @contact = @event_list.event_list_contacts.find(params[:id])
  end

  def contact_params
    params.require(:event_list_contact).permit(:email, :name, :first_name, :last_name, :dni, :country)
  end
end
