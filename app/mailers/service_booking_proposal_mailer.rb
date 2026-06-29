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
    @recipient = actor == @proposal.artist ? @proposal.booker : @proposal.artist
    assign_people

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
    @event_date = I18n.l(proposal.event_date, format: :long)
  end

  def assign_people
    @actor_name = display_name(@actor)
    @recipient_name = display_name(@recipient)
  end

  def display_name(user)
    user.display_name.presence || user.full_name.presence || user.username
  end
end
