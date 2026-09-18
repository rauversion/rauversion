import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { post } from "@rails/request.js"
import { CheckCircle } from "lucide-react"

type CheckoutQuote = { currency: string, subtotal: string | number, service_fee: string | number, total: string | number }
type Props = {
  courseId: string | number,
  courseProduct?: { currency?: string },
  enrollmentType: string,
  checkoutQuote?: CheckoutQuote,
  onSuccess?: () => void
}

export default function CourseEnrollmentForm({ courseId, courseProduct, enrollmentType, checkoutQuote, onSuccess }: Props) {
  const [enrolling, setEnrolling] = useState(false)
  const [enrolled, setEnrolled] = useState(false)
  const [error, setError] = useState("")
  const paid = enrollmentType === "paid"
  const formatMoney = (amount: string | number) => new Intl.NumberFormat(undefined, {
    style: "currency", currency: checkoutQuote?.currency || courseProduct?.currency || "USD"
  }).format(Number(amount || 0))

  const handleEnroll = async () => {
    setEnrolling(true)
    setError("")
    try {
      const response = await post("/course_enrollments.json", {
        body: JSON.stringify({ course_enrollment: { course_id: courseId } })
      })
      const data = await response.json
      if (!response.ok) throw new Error(data.error || I18n.t("courses.enrollment_form.enrollment_error"))
      if (data.checkout_url) {
        window.location.assign(data.checkout_url)
      } else {
        setEnrolled(true)
        onSuccess?.()
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : I18n.t("courses.enrollment_form.enrollment_error"))
    } finally {
      setEnrolling(false)
    }
  }

  if (enrolled) return <div className="py-6 text-center"><CheckCircle className="mx-auto mb-3 h-10 w-10" />{I18n.t("courses.enrollment_form.enrolled_title")}</div>
  if (enrollmentType === "invite") return <p className="py-6 text-muted-foreground">{I18n.t("courses.enrollment_form.enrollment_closed")}</p>

  return (
    <div className="space-y-6 py-4">
      <ul className="space-y-2 text-sm">
        {["full_access", "downloadable_resources", "access_any_device"].map((key) => (
          <li key={key} className="flex items-center gap-2"><CheckCircle className="h-4 w-4" />{I18n.t(`courses.enrollment_form.${key}`)}</li>
        ))}
      </ul>
      {paid && checkoutQuote && (
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt>{I18n.t("courses.enrollment_form.course_price")}</dt><dd>{formatMoney(checkoutQuote.subtotal)}</dd></div>
          <div className="flex justify-between"><dt>{I18n.t("courses.enrollment_form.service_fee")}</dt><dd>{formatMoney(checkoutQuote.service_fee)}</dd></div>
          <div className="flex justify-between border-t pt-2 font-semibold"><dt>{I18n.t("courses.enrollment_form.total")}</dt><dd>{formatMoney(checkoutQuote.total)}</dd></div>
        </dl>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button className="w-full" onClick={handleEnroll} disabled={enrolling}>
        {enrolling ? I18n.t("courses.enrollment_form.enrolling") : I18n.t(paid ? "courses.enrollment_form.pay_with_stripe" : "courses.enrollment_form.enroll_free")}
      </Button>
    </div>
  )
}
