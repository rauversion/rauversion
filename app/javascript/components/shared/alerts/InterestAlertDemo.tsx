import React from 'react';
import { InterestAlert } from './';
import { Toaster } from "../../ui/toaster";

const InterestAlertDemo = () => {
  const handleSubmit = (type: string) => {
    console.log(`Interest submitted for ${type}`);
  };

  return (
    <div className="min-h-screen bg-muted p-8">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <InterestAlert 
          type="artist" 
          onSubmit={() => handleSubmit('artist')} 
        />
        <InterestAlert 
          type="seller" 
          onSubmit={() => handleSubmit('seller')} 
        />
      </div>
      <Toaster />
    </div>
  );
};

export default InterestAlertDemo;
