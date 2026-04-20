module Newsletter
  class ContactListContactsController < BaseController
    before_action :set_contact_list
    before_action :set_contact, only: [:show, :update, :destroy]

    def index
      contacts = @contact_list.contacts.order(created_at: :desc).page(params[:page]).per(50)

      render json: {
        contacts: contacts.map { |contact| serialize_contact(contact) },
        pagination: {
          current_page: contacts.current_page,
          total_pages: contacts.total_pages,
          total_count: contacts.total_count,
        },
      }
    end

    def show
      render json: { contact: serialize_contact(@contact) }
    end

    def create
      contact = @contact_list.contacts.new(contact_params)

      if contact.save
        render json: { contact: serialize_contact(contact) }, status: :created
      else
        render json: { errors: contact.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @contact.update(contact_params)
        render json: { contact: serialize_contact(@contact) }
      else
        render json: { errors: @contact.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @contact.destroy
      head :no_content
    end

    private

    def set_contact_list
      @contact_list = current_user.newsletter_contact_lists.find(params[:contact_list_id])
    end

    def set_contact
      @contact = @contact_list.contacts.find(params[:id])
    end

    def contact_params
      params.require(:contact).permit(:email, :name, :first_name, :last_name, :country, :dni)
    end

    def serialize_contact(contact)
      {
        id: contact.id.to_s,
        email: contact.email,
        name: contact.name,
        first_name: contact.first_name,
        last_name: contact.last_name,
        country: contact.country,
        dni: contact.dni,
        resolved_name: contact.resolved_name,
        created_at: contact.created_at,
      }
    end
  end
end
