
json.invisible_captcha do
  json.timestamp Time.current.to_i
  json.field_name InvisibleCaptcha.get_honeypot
end
