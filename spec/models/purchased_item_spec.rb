require "rails_helper"

RSpec.describe PurchasedItem, type: :model do
  it "loads archived ticket types alongside other kinds of purchased items" do
    buyer = create(:user)
    event = create(:event, user: buyer)
    ticket = create(:event_ticket, event: event)
    ticket_purchase = create(:purchase, user: buyer, purchasable: event, state: "paid")
    ticket_item = create(:purchased_item, purchase: ticket_purchase, purchased_item: ticket, state: "paid")
    track = create(:track, user: buyer)
    track_purchase = create(:purchase, user: buyer, purchasable: track, state: "paid")
    track_item = create(:purchased_item, purchase: track_purchase, purchased_item: track, state: "paid")
    ticket.destroy!

    expect(ticket_item.reload.purchased_item).to eq(ticket)
    expect(track_item.reload.purchased_item).to eq(track)

    items = PurchasedItem.where(id: [ticket_item.id, track_item.id]).includes(:purchased_item).index_by(&:id)

    expect(items.fetch(ticket_item.id).purchased_item).to eq(ticket)
    expect(items.fetch(track_item.id).purchased_item).to eq(track)
    expect(EventTicket.find_by(id: ticket.id)).to be_nil
  end
end
