json.link_types do
  @link_types.each do |type, name|
    klass = "UserLinks::#{type.to_s.classify}Link".constantize
    instance = klass.new
    json.set! type do
      json.name name
      json.icon_class instance.icon_class
      json.type type
      json.icon_url image_url(instance.image_name)
    end
  end
end

if flash[:error].present?
  json.error flash[:error]
end
