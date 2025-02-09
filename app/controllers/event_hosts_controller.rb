class EventHostsController < ApplicationController
  before_action :authenticate_user!, except: [:index, :show]
  before_action :set_event, except: [:index, :show]

  def new
    @event_host = @event.event_hosts.new
  end

  def create
    if params[:event_hosts_attributes].present?
      create_multiple_hosts
    else
      create_single_host
    end
  end

  def edit
    @event_host = @event.event_hosts.find(params[:id])
  end

  def destroy
    @event_host = @event.event_hosts.find(params[:id])
    @event_host.destroy

    respond_to do |format|
      format.html do
        if @event_host.destroyed?
          flash.now[:notice] = "Host removed"
        end
      end
      format.json
    end
  end

  def update
    @event_host = @event.event_hosts.find(params[:id])
    
    respond_to do |format|
      if @event_host.update(event_host_params)
        format.html { flash.now[:notice] = "Host updated" }
        format.json
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render :update, status: :unprocessable_entity }
      end
    end
  end

  private

  def set_event
    @event = current_user.events.friendly.find(params[:event_id])
  end

  def create_multiple_hosts
    @created_hosts = []
    @failed_hosts = []

    params[:event_hosts_attributes].each do |host_params|
      event_host = @event.event_hosts.new(multiple_hosts_params(host_params))
      event_host.invite_user
      
      if event_host.save
        @created_hosts << event_host
      else
        @failed_hosts << {
          params: host_params,
          errors: event_host.errors.full_messages
        }
      end
    end

    respond_to do |format|
      format.html do
        if @failed_hosts.empty?
          flash.now[:notice] = "All hosts created successfully"
        else
          flash.now[:alert] = "Some hosts could not be created"
        end
      end
      format.json
    end
  end

  def create_single_host
    @event_host = @event.event_hosts.new(event_host_params)
    @event_host.invite_user

    respond_to do |format|
      if @event_host.save
        format.html { flash.now[:notice] = "Host created" }
        format.json
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render :create, status: :unprocessable_entity }
      end
    end
  end

  def event_host_params
    params.require(:event_host).permit(
      :email, :name, :description, :listed_on_page, :event_manager, :avatar
    )
  end

  def multiple_hosts_params(params)
    params.permit(
      :email, :name, :description, :listed_on_page, :event_manager, :avatar
    )
  end
end
