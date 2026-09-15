class ServiceBookingProposalMailer < ApplicationMailer
  def proposal_created(proposal)
    assign_proposal(proposal)
    @actor = @proposal.booker
    @recipient = @proposal.artist
    assign_people

    mail(
      to: @recipient.email,
      subject: default_i18n_subject(
        event: @proposal.event_name,
        booker: display_name(@actor)
      )
    )
  end

  def counterproposal_received(proposal, actor)
    assign_proposal(proposal)
    @actor = actor
    @recipient = recipient_for(actor)
    assign_people

    mail(
      to: @recipient.email,
      subject: default_i18n_subject(
        event: @proposal.event_name,
        actor: display_name(@actor)
      )
    )
  end

  def proposal_accepted(proposal, actor)
    assign_decision_notification(proposal, actor)

    mail(
      to: @recipient.email,
      subject: default_i18n_subject(
        event: @proposal.event_name,
        actor: display_name(@actor)
      )
    )
  end

  def proposal_rejected(proposal, actor)
    assign_decision_notification(proposal, actor)

    mail(
      to: @recipient.email,
      subject: default_i18n_subject(
        event: @proposal.event_name,
        actor: display_name(@actor)
      )
    )
  end

  def proposal_cancelled(proposal, actor)
    assign_decision_notification(proposal, actor)

    mail(
      to: @recipient.email,
      subject: default_i18n_subject(
        event: @proposal.event_name,
        actor: display_name(@actor)
      )
    )
  end

  private

  def assign_proposal(proposal)
    @proposal = proposal
    @service = proposal.service_product
    @proposal_url = service_booking_proposal_url(proposal)
    @booking = proposal.service_booking
    @booking_url = service_booking_url(@booking) if @booking
    @event_date = I18n.l(proposal.event_date, format: :long)
  end

  def assign_decision_notification(proposal, actor)
    assign_proposal(proposal)
    @actor = actor
    @recipient = recipient_for(actor)
    assign_people
  end

  def assign_people
    @actor_name = display_name(@actor)
    @recipient_name = display_name(@recipient)
  end

  def recipient_for(actor)
    actor == @proposal.artist ? @proposal.booker : @proposal.artist
  end

  def display_name(user)
    user.display_name.presence || user.full_name.presence || user.username
  end
end
