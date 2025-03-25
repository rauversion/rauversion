import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface InterestAlertProps {
  type: 'artist' | 'seller';
  onSubmit: () => void;
}

const InterestAlert: React.FC<InterestAlertProps> = ({ type, onSubmit }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { toast } = useToast();

  const handleSubmit = () => {
    setIsSubmitted(true);
    onSubmit();
    
    setTimeout(() => {
      toast({
        title: "Success!",
        description: `Your interest in becoming a ${type} has been submitted.`,
      });
    }, 1000);
  };

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
                {type === 'artist' ? 'Become an Artist' : 'Become a Seller'}
              </h3>
              <p className="text-lg opacity-90">
                {type === 'artist' 
                  ? 'Share your music with the world and grow your fanbase'
                  : 'Start selling your merchandise and reach more customers'}
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleSubmit}
                  className="w-full bg-white text-purple-600 hover:bg-opacity-90"
                >
                  Submit Interest
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
