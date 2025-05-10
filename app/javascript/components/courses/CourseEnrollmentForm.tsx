import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { post } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { CheckCircle, Sparkles } from "lucide-react"

export default function CourseEnrollmentForm({ courseId, onSuccess }: { courseId: string | number, onSuccess?: () => void }) {
  const { toast } = useToast()
  const [enrolling, setEnrolling] = useState(false)
  const [enrolled, setEnrolled] = useState(false)

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

  if (enrolled) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="flex flex-col items-center justify-center py-8"
      >
        <CheckCircle className="h-16 w-16 text-green-500 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold mb-2">You're enrolled!</h2>
        <p className="text-muted-foreground mb-4">Welcome to the course. Check your dashboard to get started.</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="flex flex-col items-center justify-center py-8"
    >
      <motion.button
        whileHover={{ scale: 1.08, boxShadow: "0 0 0 4px #a21caf44" }}
        whileTap={{ scale: 0.96 }}
        className="bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white font-bold text-xl px-8 py-4 rounded-full shadow-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
        onClick={handleEnroll}
        disabled={enrolling}
      >
        <Sparkles className="h-6 w-6 animate-pulse" />
        {enrolling ? "Enrolling..." : "Enroll Now"}
      </motion.button>
      <p className="text-sm text-muted-foreground mt-4">No email required. Instant access!</p>
    </motion.div>
  )
}
