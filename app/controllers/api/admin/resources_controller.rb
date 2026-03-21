module Api
  module Admin
    class ResourcesController < BaseController
      before_action :set_resource_definition
      before_action :set_record, only: [:show, :update, :destroy, :action]

      def index
        relation = scoped_relation
        records = relation.page(current_page).per(per_page)

        render json: {
          resource: serialize_resource_definition,
          records: records.map { |record| serialize_record(record) },
          pagination: {
            current_page: records.current_page,
            total_pages: records.total_pages,
            total_count: records.total_count,
            per_page: records.limit_value
          },
          scope: active_scope[:key].to_s,
          query: search_query
        }
      end

      def show
        render json: {
          resource: serialize_resource_definition,
          record: serialize_record(@record, detail: true)
        }
      end

      def create
        unless @resource[:creatable]
          return render json: { error: "Create not allowed for this resource" }, status: :forbidden
        end

        record = @resource[:model].new(permitted_attributes)

        if record.save
          render json: {
            resource: serialize_resource_definition,
            record: serialize_record(record, detail: true)
          }, status: :created
        else
          render json: { errors: record.errors.to_hash(true) }, status: :unprocessable_entity
        end
      end

      def update
        unless @resource[:editable]
          return render json: { error: "Update not allowed for this resource" }, status: :forbidden
        end

        if @record.update(permitted_attributes)
          render json: {
            resource: serialize_resource_definition,
            record: serialize_record(@record, detail: true)
          }
        else
          render json: { errors: @record.errors.to_hash(true) }, status: :unprocessable_entity
        end
      end

      def destroy
        unless @resource[:destroyable]
          return render json: { error: "Delete not allowed for this resource" }, status: :forbidden
        end

        if @record.destroy
          head :no_content
        else
          render json: { errors: @record.errors.to_hash(true) }, status: :unprocessable_entity
        end
      end

      def action
        action_definition = Array(@resource[:custom_actions]).find { |candidate| candidate[:key].to_s == params[:action_key].to_s }
        return render json: { error: "Unknown action" }, status: :not_found if action_definition.blank?

        result = if action_definition[:run].arity == 1
          action_definition[:run].call(@record)
        else
          action_definition[:run].call(@record, action_payload)
        end

        render json: {
          resource: serialize_resource_definition,
          result: result || {},
          record: serialize_record(@record.reload, detail: true)
        }
      end

      private

      def set_resource_definition
        @resource_key = params[:resource_key].to_sym
        @resource = ::Admin::ResourceRegistry.fetch!(@resource_key)
      end

      def set_record
        @record = @resource[:model].find(params[:id])
      end

      def scoped_relation
        relation = @resource[:model].all
        relation = active_scope[:apply].call(relation)
        relation = apply_search(relation)
        @resource[:order].call(relation)
      end

      def active_scope
        @active_scope ||= ::Admin::ResourceRegistry.scope_for(@resource, params[:scope].presence || "all")
      end

      def apply_search(relation)
        return relation if search_query.blank? || Array(@resource[:search_fields]).blank?

        table = @resource[:model].arel_table
        clauses = @resource[:search_fields].filter_map do |field|
          next unless @resource[:model].columns_hash.key?(field.to_s)

          table[field].lower.matches("%#{search_query.downcase}%")
        end

        return relation if clauses.blank?

        relation.where(clauses.reduce { |combined, clause| combined.or(clause) })
      end

      def search_query
        params[:query].to_s.strip
      end

      def current_page
        params[:page].to_i.positive? ? params[:page].to_i : 1
      end

      def per_page
        requested = params[:per_page].to_i
        return 25 unless requested.positive?

        [requested, 100].min
      end

      def permitted_attributes
        params.fetch(:record, {}).permit(*Array(@resource[:permitted_fields]))
      end

      def action_payload
        params.fetch(:payload, ActionController::Parameters.new).permit!.to_h
      end

      def serialize_resource_definition
        ::Admin::ResourceRegistry.serialize_definition(@resource_key, @resource)
      end

      def serialize_record(record, detail: false)
        payload = {
          id: record.id,
          values: serialize_values(record, @resource[:columns]),
          actions: @resource[:row_actions].respond_to?(:call) ? @resource[:row_actions].call(record) : []
        }

        return payload unless detail

        payload.merge(
          form_values: serialize_form_values(record),
          metadata: {
            created_at: record.try(:created_at),
            updated_at: record.try(:updated_at)
          }
        )
      end

      def serialize_values(record, fields)
        Array(fields).each_with_object({}) do |field, memo|
          memo[field[:key].to_s] = normalize_value(resolve_field_value(record, field))
        end
      end

      def serialize_form_values(record)
        Array(@resource[:form_fields]).each_with_object({}) do |field, memo|
          memo[field[:key].to_s] = normalize_value(resolve_field_value(record, field))
        end
      end

      def resolve_field_value(record, field)
        if field[:value].respond_to?(:call)
          field[:value].call(record)
        else
          record.public_send(field[:key])
        end
      end

      def normalize_value(value)
        case value
        when Time, Date, DateTime, ActiveSupport::TimeWithZone
          value.iso8601
        else
          value
        end
      end
    end
  end
end
