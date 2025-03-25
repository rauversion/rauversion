json.link_types do
  @link_types.each do |type, name|
    klass = "UserLinks::#{type.to_s.classify}Link".constantize
    json.set! type do
      json.name name
      json.icon_class klass.new.icon_class
      json.type type
    end
  end
end
