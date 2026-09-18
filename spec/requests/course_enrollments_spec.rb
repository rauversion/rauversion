require "rails_helper"

RSpec.describe "Course enrollments", type: :request do
  let(:owner) { create(:user, confirmed_at: Time.current, stripe_account_id: "acct_course_seller") }
  let(:student) { create(:user, confirmed_at: Time.current) }
  let(:course) { create(:course, user: owner, published: true, price: 0, enrollment_type: "free") }
  let(:course_module) { create(:course_module, course: course) }
  let(:lesson) { create(:lesson, course_module: course_module) }

  def enroll
    post "/course_enrollments.json", params: { course_enrollment: { course_id: course.to_param } }
  end

  it "requires authentication" do
    enroll
    expect(response).to have_http_status(:unauthorized)
    expect(CourseEnrollment.count).to eq(0)
  end

  it "enrolls in a free course once and grants lesson access" do
    sign_in student
    2.times { enroll; expect(response).to have_http_status(:ok) }
    expect(course.course_enrollments.where(user: student).count).to eq(1)
    get "/courses/#{course.id}/lessons/#{lesson.id}.json"
    expect(response).to have_http_status(:ok)
  end

  it "does not enroll someone into an unpublished or invite-only course" do
    sign_in student
    course.update!(enrollment_type: "invite")
    enroll
    expect(response).to have_http_status(:forbidden)
    course.update!(published: false)
    enroll
    expect(response).to have_http_status(:not_found)
    expect(course.course_enrollments).to be_empty
  end

  it "restricts enrollment and progress endpoints to the enrolled user" do
    enrollment = course.course_enrollments.create!(user: owner)
    sign_in student
    get "/course_enrollments/#{enrollment.id}.json"
    expect(response).to have_http_status(:not_found)
    sign_in student
    post "/course_enrollments/#{enrollment.id}/finish_lesson.json", params: { lesson_id: lesson.id }
    expect(response).to have_http_status(:not_found)
    expect(enrollment.reload.finished_lessons).to be_empty
  end

  it "only tracks lessons from the enrolled course" do
    enrollment = course.course_enrollments.create!(user: student)
    sign_in student
    other_course = create(:course, user: owner, price: 0)
    other_lesson = create(:lesson, course_module: create(:course_module, course: other_course))
    post "/course_enrollments/#{enrollment.id}/finish_lesson.json", params: { lesson_id: other_lesson.id }
    expect(response).to have_http_status(:not_found)
    sign_in student
    post "/course_enrollments/#{enrollment.id}/finish_lesson.json", params: { lesson_id: lesson.id }
    expect(response).to have_http_status(:ok)
    expect(enrollment.reload.finished_lessons).to eq([lesson.id])
  end

  context "paid enrollment" do
    let(:stripe_session) { double(id: "cs_course_test", url: "https://checkout.stripe.com/c/pay/cs_course_test") }
    before do
      course.update!(enrollment_type: "paid", price: 100)
      sign_in student
      allow(ENV).to receive(:fetch).and_call_original
      allow(ENV).to receive(:fetch).with("PLATFORM_EVENTS_FEE", 10).and_return("10")
      allow(Stripe::Checkout::Session).to receive(:create).and_return(stripe_session)
    end

    def confirm_payment(payment_status: "paid", amount: 11_000, id: "cs_course_test")
      event = Stripe::Event.construct_from({
        id: "evt_course", type: "checkout.session.completed",
        data: { object: { id: id, payment_status: payment_status, payment_intent: "pi_course_test",
          amount_total: amount, currency: "usd",
          metadata: { source_type: "course", purchase_id: ProductPurchase.last.id.to_s, course_id: course.id.to_s } } }
      })
      allow(Stripe::Webhook).to receive(:construct_event).and_return(event)
      post "/webhooks/stripe", params: event.to_json, headers: { "CONTENT_TYPE" => "application/json", "Stripe-Signature" => "test" }
    end

    it "charges the course plus the event service fee through Stripe without enrolling early" do
      enroll
      expect(response.parsed_body["checkout_url"]).to eq(stripe_session.url)
      expect(course.course_enrollments).to be_empty
      purchase = ProductPurchase.last
      expect(purchase).to be_pending
      expect(purchase.total_amount).to eq(110)
      expect(purchase.product_purchase_items.sole.price).to eq(100)
      expect(Stripe::Checkout::Session).to have_received(:create).with(
        hash_including(
          line_items: array_including(hash_including("price_data" => hash_including("unit_amount" => 1_000))),
          payment_intent_data: { application_fee_amount: 1_000, transfer_data: { destination: owner.stripe_account_id } },
          metadata: hash_including(source_type: "course")
        ), hash_including(idempotency_key: "course-checkout-#{purchase.id}")
      )
      get "/courses/#{course.id}/lessons/#{lesson.id}.json"
      expect(response).to have_http_status(:forbidden)
    end

    it "activates access once after a signed paid checkout webhook, even if the course price changes" do
      enroll
      course.update!(price: 200)
      2.times { confirm_payment; expect(response).to have_http_status(:ok) }
      expect(course.course_enrollments.where(user: student).count).to eq(1)
      expect(ProductPurchase.last).to be_completed
      get "/courses/#{course.id}/lessons/#{lesson.id}.json"
      expect(response).to have_http_status(:ok)
    end

    it "reuses an open checkout when the student retries enrollment" do
      enroll
      allow(Stripe::Checkout::Session).to receive(:retrieve).with(stripe_session.id).and_return(
        double(status: "open", url: stripe_session.url)
      )
      expect { enroll }.not_to change(ProductPurchase, :count)
      expect(response.parsed_body["checkout_url"]).to eq(stripe_session.url)
      expect(Stripe::Checkout::Session).to have_received(:create).once
    end

    it "does not activate access for unpaid, mismatched or forged return URLs" do
      enroll
      confirm_payment(payment_status: "unpaid")
      confirm_payment(amount: 100)
      confirm_payment(id: "cs_other")
      get "/courses/#{course.id}.json?checkout=success&get_enrollment=true"
      expect(response.parsed_body["enrollment"]).to be_nil
      expect(course.course_enrollments).to be_empty
      expect(ProductPurchase.last).to be_pending
    end

    it "keeps access locked when Stripe fails and exposes a retryable error" do
      allow(Stripe::Checkout::Session).to receive(:create).and_raise(Stripe::InvalidRequestError.new("invalid", nil))
      enroll
      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body["error"]).to be_present
      expect(ProductPurchase.last).to be_failed
      expect(course.course_enrollments).to be_empty
    end

    it "requires the seller to connect Stripe" do
      owner.update!(stripe_account_id: nil)
      expect { enroll }.not_to change(ProductPurchase, :count)
      expect(response).to have_http_status(:unprocessable_entity)
      expect(Stripe::Checkout::Session).not_to have_received(:create)
    end

    it "handles zero-decimal currencies when calculating the fee" do
      course.course_product.update!(currency: "clp")
      course.update!(price: 10_000)
      enroll
      expect(Stripe::Checkout::Session).to have_received(:create).with(
        hash_including(line_items: array_including(hash_including("price_data" => hash_including("unit_amount" => 1_000, "currency" => "clp")))), anything
      )
      expect(ProductPurchase.last.total_amount).to eq(11_000)
    end
  end
end
