import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { post, get } from "@rails/request.js";
import I18n from "@/stores/locales";

interface InterestAlertProps {
  type: "artist" | "seller";
  onSubmit: () => void;
}

const InterestAlert: React.FC<InterestAlertProps> = ({ type, onSubmit }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const { toast } = useToast();

  console.log("Intereset alert for ", type);
  const localeType = I18n.t(`interest_alert.roles.${type}`);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await get(`/interest_alerts/status?role=${type}`);
        const data = await response.json;
        setHasPendingRequest(data.has_pending_request);
        if (data.approved) {
          // If already approved, they shouldn't see this component
          onSubmit();
        }
      } catch (error) {
        console.error("Error checking status:", error);
      }
    };

    checkStatus();
  }, [type]);

  const handleSubmit = async () => {
    try {
      const response = await post("/interest_alerts.json", {
        body: JSON.stringify({
          interest_alert: {
            role: type,
            body:
              message ||
              I18n.t("interest_alert.default_message", { type: localeType }),
          },
        }),
      });

      const data = await response.json;

      setIsSubmitted(true);
      onSubmit();
      toast({
        title: I18n.t("interest_alert.toast.success.title"),
        description:
          data.message ||
          I18n.t("interest_alert.toast.success.description", {
            type: localeType,
          }),
      });
    } catch (error: any) {
      toast({
        title: I18n.t("interest_alert.toast.error.title"),
        description:
          error?.message || I18n.t("interest_alert.toast.error.description"),
        variant: "destructive",
      });
    }
  };

  if (hasPendingRequest) {
    return (
      <Card className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <div className="space-y-4">
          <h3 className="text-2xl font-bold">
            {I18n.t("interest_alert.review.title")}
          </h3>
          <p className="text-lg opacity-90">
            {I18n.t("interest_alert.review.message", { type: localeType })}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <AnimatePresence>
      {!isSubmitted ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h3 className="text-2xl font-bold">
                {I18n.t(`interest_alert.title.${type}`)}
              </h3>
              <p className="text-lg opacity-90">
                {I18n.t(`interest_alert.description.${type}`)}
              </p>

              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={I18n.t("interest_alert.input.placeholder", {
                  type: localeType,
                })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleSubmit}
                  className="w-full bg-white text-purple-600 hover:bg-white/90"
                >
                  {I18n.t("interest_alert.submit")}
                </Button>
              </motion.div>
            </motion.div>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="flex items-center justify-center"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 360],
            }}
            transition={{
              duration: 0.8,
              ease: "easeInOut",
            }}
            className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center"
          >
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InterestAlert;
