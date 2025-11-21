require 'csv'

class EventListsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_event
  before_action :check_event_owner
  before_action :set_event_list, only: [:show, :update, :destroy]

  def index
    @collection = @event.event_lists.order(created_at: :desc).page(params[:page]).per(10)
    respond_to do |format|
      format.json
    end
  end

  def show
    respond_to do |format|
      format.json
    end
  end

  def create
    @event_list = @event.event_lists.new(event_list_params)
    
    if @event_list.save
      respond_to do |format|
        format.json { render json: @event_list, status: :created }
      end
    else
      respond_to do |format|
        format.json { render json: { errors: @event_list.errors.full_messages }, status: :unprocessable_entity }
      end
    end
  end

  def update
    if @event_list.update(event_list_params)
      respond_to do |format|
        format.json { render json: @event_list }
      end
    else
      respond_to do |format|
        format.json { render json: { errors: @event_list.errors.full_messages }, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @event_list.destroy
    respond_to do |format|
      format.json { head :no_content }
    end
  end

  def import
    @event_list = @event.event_lists.find(params[:id])
    
    unless params[:file].present?
      respond_to do |format|
        format.json { render json: { errors: [I18n.t('event_lists.import.no_file')] }, status: :unprocessable_entity }
      end
      return
    end

    begin
      file = params[:file]
      imported_count = 0
      errors = []

      CSV.foreach(file.path, headers: true, header_converters: :symbol) do |row|
        contact = @event_list.event_list_contacts.new(
          email: row[:email],
          name: row[:name],
          first_name: row[:first_name],
          last_name: row[:last_name],
          dni: row[:dni],
          country: row[:country]
        )

        if contact.save
          imported_count += 1
        else
          errors << "Row #{row.to_h}: #{contact.errors.full_messages.join(', ')}"
        end
      end

      respond_to do |format|
        format.json do
          render json: {
            imported: imported_count,
            errors: errors,
            total: imported_count + errors.length
          }
        end
      end
    rescue CSV::MalformedCSVError => e
      respond_to do |format|
        format.json { render json: { errors: [I18n.t('event_lists.import.invalid_csv', message: e.message)] }, status: :unprocessable_entity }
      end
    rescue => e
      respond_to do |format|
        format.json { render json: { errors: [I18n.t('event_lists.import.error', message: e.message)] }, status: :unprocessable_entity }
      end
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
    @event_list = @event.event_lists.find(params[:id])
  end

  def event_list_params
    params.require(:event_list).permit(:name)
  end
end
