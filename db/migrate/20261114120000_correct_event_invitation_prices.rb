class CorrectEventInvitationPrices < ActiveRecord::Migration[8.1]
  def up
    # Older invitations stored the ticket's list price without a checkout.
    # A regular free checkout stores zero and paid checkouts store provider details.
    execute <<~SQL
      WITH invitations AS (
        UPDATE purchases
        SET price = 0,
            payment_metadata = payment_metadata || '{"invitation": true}'::jsonb
        WHERE purchasable_type = 'Event'
          AND (
            payment_metadata ->> 'inviter_id' IS NOT NULL
            OR (price > 0 AND checkout_type IS NULL AND checkout_id IS NULL)
          )
          AND EXISTS (
            SELECT 1 FROM purchased_items
            WHERE purchased_items.purchase_id = purchases.id
              AND purchased_items.purchased_item_type = 'EventTicket'
          )
        RETURNING id, currency
      )
      UPDATE purchased_items
      SET price = 0,
          currency = COALESCE(purchased_items.currency, invitations.currency)
      FROM invitations
      WHERE purchased_items.purchase_id = invitations.id
        AND purchased_items.purchased_item_type = 'EventTicket'
    SQL
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
