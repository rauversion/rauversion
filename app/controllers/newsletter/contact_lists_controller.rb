require "csv"

module Newsletter
  class ContactListsController < BaseController
    before_action :set_contact_list, only: [:show, :update, :destroy, :import]

    def index
      respond_to do |format|
        format.html { render_blank }
        format.json do
          render json: {
            contact_lists: current_user.newsletter_contact_lists
              .order(updated_at: :desc)
              .map { |contact_list| serialize_contact_list(contact_list) },
          }
        end
      end
    end

    def show
      render json: {
        contact_list: serialize_contact_list(@contact_list),
      }
    end

    def create
      contact_list = current_user.newsletter_contact_lists.new(contact_list_params)

      if contact_list.save
        render json: { contact_list: serialize_contact_list(contact_list) }, status: :created
      else
        render json: { errors: contact_list.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @contact_list.update(contact_list_params)
        render json: { contact_list: serialize_contact_list(@contact_list) }
      else
        render json: { errors: @contact_list.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @contact_list.destroy
      head :no_content
    end

    def import
      unless params[:file].present?
        render json: { errors: ["Selecciona un CSV para importar"] }, status: :unprocessable_entity
        return
      end

      imported_count = 0
      errors = []

      CSV.foreach(
        params[:file].path,
        headers: true,
        header_converters: :symbol,
        encoding: "ISO-8859-1:UTF-8"
      ) do |row|
        contact = @contact_list.contacts.new(
          email: row[:email].to_s,
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

      render json: {
        imported: imported_count,
        errors: errors,
        total: imported_count + errors.length,
        contact_list: serialize_contact_list(@contact_list),
      }
    rescue CSV::MalformedCSVError => e
      render json: { errors: ["CSV invalido: #{e.message}"] }, status: :unprocessable_entity
    rescue StandardError => e
      render json: { errors: ["No se pudo importar el CSV: #{e.message}"] }, status: :unprocessable_entity
    end

    private

    def set_contact_list
      @contact_list = current_user.newsletter_contact_lists.find(params[:id])
    end

    def contact_list_params
      params.require(:contact_list).permit(:name)
    end

    def serialize_contact_list(contact_list)
      {
        id: contact_list.id.to_s,
        name: contact_list.name,
        contacts_count: contact_list.contacts.count,
        updated_at: contact_list.updated_at,
        created_at: contact_list.created_at,
      }
    end
  end
end
