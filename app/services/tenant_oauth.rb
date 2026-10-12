class TenantOauth
  def initialize(request, session)
    @request = request
    @session = session
  end

  def start(provider:, tenant:, return_to:)
    @session[:tenant_oauth_nonce] = SecureRandom.hex(32)
    verifier.generate({
      "provider" => provider,
      "tenant_id" => tenant.id,
      "return_to" => return_to,
      "origin" => @request.base_url,
      "nonce" => @session[:tenant_oauth_nonce]
    }, purpose: :tenant_oauth, expires_in: 15.minutes)
  end

  def verify(token, provider:)
    context = verifier.verified(token, purpose: :tenant_oauth)
    return unless context.is_a?(Hash) && context["provider"] == provider
    return unless Tenant.exists?(id: context["tenant_id"])

    context
  end

  def bind(token)
    @session[:tenant_oauth_flow] = Digest::SHA256.hexdigest(token)
  end

  def bound?(token)
    @session[:tenant_oauth_flow] == Digest::SHA256.hexdigest(token)
  end

  def finish
    @session.delete(:tenant_oauth_nonce)
    finish_base
  end

  def finish_base
    @session.delete(:tenant_oauth_flow)
  end

  def base_request?
    @request.base_url == AppDomain.base_url
  end

  def origin_request?(context)
    context["origin"] == @request.base_url
  end

  def url_for(path)
    "#{AppDomain.base_url}#{path}"
  end

  def return_url(path, context)
    "#{context.fetch("origin")}#{path}"
  end

  def handoff(context, auth: nil, error: nil)
    encryptor.encrypt_and_sign({"context" => context, "auth" => auth&.except("extra"), "error" => error},
      purpose: :tenant_oauth_handoff, expires_in: 1.minute)
  end

  def receive(token, provider:)
    return unless token.is_a?(String) && token.present?

    result = encryptor.decrypt_and_verify(token, purpose: :tenant_oauth_handoff)
    return unless result.is_a?(Hash)

    context = result["context"]
    return unless context.is_a?(Hash) && context["provider"] == provider
    return unless source_session?(context) && origin_request?(context)
    return unless context["tenant_id"] == Current.tenant.id

    result
  rescue ActiveSupport::MessageEncryptor::InvalidMessage
    nil
  end

  private

  def source_session?(context)
    @session[:tenant_oauth_nonce].present? &&
      ActiveSupport::SecurityUtils.secure_compare(context["nonce"].to_s, @session[:tenant_oauth_nonce])
  end

  def encryptor
    key = Rails.application.key_generator.generate_key("tenant_oauth_handoff", 32)
    ActiveSupport::MessageEncryptor.new(key, cipher: "aes-256-gcm", serializer: JSON, url_safe: true)
  end

  def verifier
    Rails.application.message_verifier(:tenant_oauth)
  end
end
