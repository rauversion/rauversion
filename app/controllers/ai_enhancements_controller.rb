class AiEnhancementsController < ApplicationController

  before_action :authenticate_user!
  before_action :guard_artist

  def enhance
    scope = params[:scope]
    text = params[:text]
    custom_prompt = params[:prompt]
    
    client = OpenAI::Client.new(access_token: ENV['OPENAI_API_KEY'])
    
    # Define context based on scope
    context = case scope
    when "product_service"
      "You are helping to enhance the description of a service product. " \
      "Make the text more engaging and professional while maintaining its core message. " \
      "Focus on highlighting value propositions and benefits."
    else
      "Enhance the text to be more engaging and professional while maintaining its core message."
    end

    # Build messages array with custom prompt if provided
    messages = [
      { role: "system", content: context }
    ]

    if custom_prompt.present?
      messages << { role: "user", content: "Using this instruction: #{custom_prompt}, enhance the following text: #{text}" }
    else
      messages << { role: "user", content: "Please enhance this text: #{text}" }
    end

    Rails.logger.info(messages)
    
    response = client.chat(
      parameters: {
        model: "gpt-4",
        messages: messages,
        temperature: 0.7
      }
    )

    enhanced_text = response.dig("choices", 0, "message", "content")
    
    render json: { enhanced_text: enhanced_text }
  rescue => e
    render json: { error: e.message }, status: :unprocessable_entity
  end
end
