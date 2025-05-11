import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { post } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { CheckCircle, Sparkles } from "lucide-react"
import useCartStore from '@/stores/cartStore'

export default function CourseEnrollmentForm({
  courseId,
  courseProduct,
  enrollmentType,
  onSuccess
}: {
  courseId: string | number,
  courseProduct?: { id: number, price: number, formatted_price?: string },
  enrollmentType?: string,
  onSuccess?: () => void
}) {
  const { toast } = useToast()
  const [enrolling, setEnrolling] = useState(false)
  const [enrolled, setEnrolled] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const { addToCart } = useCartStore()

  const handleEnroll = async () => {
    setEnrolling(true)
    try {
      const response = await post("/course_enrollments", {
        body: JSON.stringify({
          course_enrollment: {
            course_id: courseId
          }
        }),
        headers: { "Content-Type": "application/json" }
      })
      if (response.ok) {
        setEnrolled(true)
        toast({ title: "You're enrolled! 🎉" })
        if (onSuccess) onSuccess()
      } else {
        toast({ title: "Enrollment failed", description: "Please try again.", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Enrollment failed", description: "Please try again.", variant: "destructive" })
    } finally {
      setEnrolling(false)
    }
  }

  const handleAddToCart = async () => {
    if (!courseProduct?.id) return
    setAddingToCart(true)
    try {
      await addToCart(courseProduct.id)
      setAddedToCart(true)
      toast({ title: "Added to cart!", description: "You can complete your purchase in the cart." })
    } catch (e) {
      toast({ title: "Could not add to cart", description: "Please try again.", variant: "destructive" })
    } finally {
      setAddingToCart(false)
    }
  }

  if (enrolled) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="flex flex-col items-center justify-center py-8"
      >
        <CheckCircle className="h-16 w-16 text-green-500 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold mb-2">{I18n.t("courses.enrollment_form.enrolled_title")}</h2>
        <p className="text-muted-foreground mb-4">{I18n.t("courses.enrollment_form.enrolled_message")}</p>
      </motion.div>
    )
  }

  // Friendly bullet list of what you get
  const whatYouGet = [
    I18n.t("courses.enrollment_form.full_access"),
    I18n.t("courses.enrollment_form.downloadable_resources"),
    //I18n.t("courses.enrollment_form.certificate_of_completion"),
    I18n.t("courses.enrollment_form.access_any_device"),
    //I18n.t("courses.enrollment_form.support"),
  ];

  // If course has a price, show Add to Cart
  if (courseProduct && courseProduct.price > 0) {
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="flex flex-col items-center justify-center py-8"
      >
        <ul className="mb-6 text-left text-base text-gray-700 space-y-2 max-w-xs">
          {whatYouGet.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-green-600 text-lg">•</span>
              <span className="text-default">{item}</span>
            </li>
          ))}
        </ul>
        <div className="mb-4 text-2xl font-bold text-fuchsia-700 flex items-center gap-2">
          {courseProduct.formatted_price || `$${courseProduct.price}`}
        </div>
        <motion.button
          whileHover={{ scale: 1.08, boxShadow: "0 0 0 4px #a21caf44" }}
          whileTap={{ scale: 0.96 }}
          className="bg-gradient-to-r from-yellow-400 to-fuchsia-600 text-white font-bold text-xl px-8 py-4 rounded-full shadow-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
          onClick={handleAddToCart}
          disabled={addingToCart || addedToCart}
        >
          <Sparkles className="h-6 w-6 animate-pulse" />
          {addingToCart
            ? I18n.t("courses.enrollment_form.adding")
            : addedToCart
            ? I18n.t("courses.enrollment_form.added")
            : I18n.t("courses.enrollment_form.add_to_cart")}
        </motion.button>
        <p className="text-sm text-muted-foreground mt-4">{I18n.t("courses.enrollment_form.purchase_full_access")}</p>
      </motion.div>
    )
  }

  // If open enrollment and free, show Enroll Now
  if (enrollmentType === "open" || enrollmentType === "public" || !courseProduct || courseProduct.price === 0) {
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="flex flex-col items-center justify-center py-8"
      >
        <ul className="mb-6 text-left text-base text-gray-700 space-y-2 max-w-xs">
          {whatYouGet.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-green-600 text-lg">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <motion.button
          whileHover={{ scale: 1.08, boxShadow: "0 0 0 4px #a21caf44" }}
          whileTap={{ scale: 0.96 }}
          className="bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white font-bold text-xl px-8 py-4 rounded-full shadow-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
          onClick={handleEnroll}
          disabled={enrolling}
        >
          <Sparkles className="h-6 w-6 animate-pulse" />
          {enrolling
            ? I18n.t("courses.enrollment_form.enrolling")
            : I18n.t("courses.enrollment_form.enroll_now")}
        </motion.button>
      </motion.div>
    )
  }

  // Otherwise, enrollment is closed
  return (
    <div className="text-center py-8 text-muted-foreground">
      {I18n.t("courses.enrollment_form.enrollment_closed")}
    </div>
  )
}
