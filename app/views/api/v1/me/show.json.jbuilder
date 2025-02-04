if current_user
  json.current_user do
    json.extract! current_user, :id, :email, :username, :full_name, :first_name, :last_name, :bio, :label, :created_at, :updated_at
    json.avatar_url do 
      json.small current_user.avatar_url(:small)
      json.medium current_user.avatar_url(:medium)
      json.large current_user.avatar_url(:large)  
    end
    json.is_admin current_user.is_admin?
    json.is_creator current_user.is_creator?
    json.can_sell_products current_user.can_sell_products?
    json.editor current_user.is_publisher?
  end
else
  json.current_user nil
end

if label_user
  json.label_user do
    json.extract! label_user, :id, :username
    json.avatar_url do 
      json.small label_user.avatar_url(:small)
      json.medium label_user.avatar_url(:medium)
      json.large label_user.avatar_url(:large)  
    end
  end
else
  json.label_user nil
end


json.cart_item_count cart_item_count
json.i18n do
  json.locale I18n.locale
end
json.env do
  json.app_name ENV["APP_NAME"]
end
