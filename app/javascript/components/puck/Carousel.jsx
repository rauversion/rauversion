import React, { useState, useEffect } from 'react';

const Carousel = ({ items = [], autoplay, interval }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (autoplay && items.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((current) => (current + 1) % items.length);
      }, interval);

      return () => clearInterval(timer);
    }
  }, [autoplay, interval, items.length]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    setCurrentIndex((current) => (current + 1) % items.length);
  };

  const prevSlide = () => {
    setCurrentIndex((current) => (current - 1 + items.length) % items.length);
  };

  if (!items.length) return null;

  return (
    <div className="relative">
      <div className="overflow-hidden relative">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {items.map((item, index) => (
            <div
              key={index}
              className="min-w-full"
              style={{
                backgroundImage: `url(${item.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                height: '400px',
              }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-40">
                <div className="container mx-auto px-4 h-full flex items-center">
                  <div className="text-white">
                    <h2 className="text-3xl font-bold mb-4">{item.title}</h2>
                    <p className="text-lg">{item.description}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {items.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 p-2 rounded-full"
          >
            ←
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 p-2 rounded-full"
          >
            →
          </button>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const config = {
  fields: {
    items: {
      type: "array",
      label: "Carousel Items",
      arrayFields: {
        image: {
          type: "custom",
          render: ({ onChange, value }) => (
            <div>
              <label>Image URL:</label>
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="border p-2 w-full"
              />
            </div>
          ),
        },
        title: {
          type: "text",
          label: "Title",
        },
        description: {
          type: "text",
          label: "Description",
        },
      },
    },
    autoplay: {
      type: "boolean",
      label: "Enable Autoplay",
      defaultValue: true,
    },
    interval: {
      type: "number",
      label: "Autoplay Interval (ms)",
      defaultValue: 5000,
    },
  }
};

export default Carousel;
