class Backstage::BaseController < ApplicationController
  layout 'backstage/admin'

  before_action :authenticate_admin
  helper_method :current_backstage_user

  before_action :set_resource_config
  helper_method :resource_class
  before_action :set_resource_scope
  before_action :set_filter_form
  helper_method :resource_class
  before_action :set_resource, only: [:show, :edit, :update, :destroy, :custom_action]
  # before_action :load_resource, only: [:show, :edit, :update, :destroy, :custom_action]

  def index
    @filter_form = Backstage::FilterForm.new(filter_params)
    @filter_form.scope = params[:scope] if params[:scope].present?
    
    #ransack_params = build_ransack_params(@filter_form)

    # @q = resource_class.ransack(ransack_params)
    # @q = resource_class.ransack(ransack_params[:conditions], combinator: ransack_params[:combinator])
    # @resources = @q.result
    
    applied_filters = apply_filters(resource_class, @filter_form.filter_items)
    @resources = applied_filters if applied_filters.present?
    @resources = resource_class if @resources.nil?

    @resources = @filter_form.apply_scope(@resources) if @filter_form.scope.present?
    @resources = @resources.page(params[:page]).per(10) # Adjust per-page as needed
  end

  def show
  end

  def new
    @resource = model_class.new
  end

  def edit
  end

  def create
    @resource = model_class.new(permitted_params)

    if @resource.save
      redirect_to [@resource], notice: "#{model_class.name} was successfully created."
    else
      render :new
    end
  end

  def update
    if @resource.update(permitted_params)
      redirect_to [@resource], notice: "#{model_class.name} was successfully updated."
    else
      Rails.logger.error(@resource.errors.full_messages)
      render :edit
    end
  end

  def destroy
    @resource.destroy
    redirect_to [model_class], notice: "#{model_class.name} was successfully destroyed."
  end

  def add_filter
    @resource = Backstage::Config.resources[controller_name.to_sym]
    @index = @filter_form.filter_items.size + 1
  end

  def custom_action
    action_name = params[:custom_action]
    resource_config = Backstage::Config.resources[controller_name.to_sym]
    action_config = resource_config.custom_actions.find { |a| a[:name].to_s == action_name.to_s }
    if action_config
      instance_exec(@resource, &action_config[:block])
    else
      render plain: "Custom action not found", status: :not_found
    end
  end

  private

  def build_ransack_params(filter_form)
    return {} if filter_form.filter_items.blank?
  
    groupings = filter_form.filter_items.map.with_index do |item, index|
      next if item.field.blank? || item.operator.blank?
  
      condition = { "#{item.field}_#{item.operator}" => item.value }
      
      if index == 0
        { m: 'or', condition => condition }
      else
        { m: item.condition.downcase, condition => condition }
      end
    end.compact
  
    { g: groupings }
  end

  def set_filter_form
    @filter_form = Backstage::FilterForm.new(filter_params)
  end

  def filter_params
    params.fetch(:filter_form, {}).permit(
      :scope, 
      :filter_combine, 
      filter_items_attributes: [:field, :operator, :value, :condition]
    )
  end

  def default_render
    if lookup_context.template_exists?(action_name, "admin/#{controller_name}", true)
      super
    else
      render template: "backstage/default/#{action_name}"
    end
  end

  def set_resource_config
    @resource_config = Backstage::Config.resources[controller_name.to_sym]
  end

  def set_resource_scope
    return unless @resource_config

    scope = params[:scope]&.to_sym
    @resources = resource_class.all

    if scope
      scope_config = @resource_config.scopes.find { |s| s[:name] == scope }
      if scope_config
        @resources = if scope_config[:lambda]
                       resource_class.instance_exec(&scope_config[:lambda])
                     elsif scope == :all
                       resource_class.all
                     else
                       resource_class.send(scope)
                     end
      end
    end

    # @resources = @resources.page(params[:page]).per(10) # Adjust per-page as needed
  end

  def resource_class
    @resource_class ||= controller_name.classify.constantize
  end

  def set_resource
    if model_class.respond_to?(:friendly)
      @resource = model_class.friendly.find(params[:id])
    else
      @resource = model_class.find(params[:id])
    end
  end

  def model_class
    raise NotImplementedError, "Subclasses must define model_class"
  end

  def permitted_params
    raise NotImplementedError, "Subclasses must define permitted_params"
  end

  def apply_filters(relation, filter_items)
    return relation if filter_items.blank?
  
    table = relation.arel_table
    conditions = filter_items.inject(nil) do |cond, item|
      next cond if item.field.blank? || item.operator.blank? #|| item.value.blank?
      new_condition = build_arel_condition(table, item)

      if cond.nil?
        new_condition
      else
        item.condition&.downcase == 'or' ? cond.or(new_condition) : cond.and(new_condition)
      end
    end
  
    relation.where(conditions) if conditions
  end
  
  def build_arel_condition(table, item)
    column = table[item.field]
    case item.operator
    when 'eq'
      column.eq(item.value)
    when 'not_eq'
      column.not_eq(item.value)
    when 'matches'
      #Arel::Nodes::Matches.new(column, "%#{item.value}%", nil, true) # true for case-insensitive
      #column.matches("%#{item.value}%") #.to_sql.gsub('LIKE', 'ILIKE')
      column.lower.matches("%#{item.value.downcase}%")
      #column.matches('%mich')
    when 'gt'
      column.gt(item.value)
    when 'lt'
      column.lt(item.value)
    when 'gteq'
      column.gteq(item.value)
    when 'lteq'
      column.lteq(item.value)
    when 'start'
      column.lower.matches("#{item.value.downcase}%")
    when 'end'
      column.lower.matches("%#{item.value.downcase}")
    else
      raise "Unsupported operator: #{item.operator}"
    end
  end

  def authenticate_admin
    if Backstage::Config.authenticate_admin_block
      instance_exec(&Backstage::Config.authenticate_admin_block)
    else
      raise Backstage::AuthenticationNotConfigured, "Please configure the authentication method for Backstage"
    end
  end

  def current_backstage_user
    send(Backstage::Config.current_user_method)
  end
  
end