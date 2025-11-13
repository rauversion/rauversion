import React, { useState, useEffect } from 'react';
import { get } from '@rails/request.js';

const YouTubeBlock = ({ url, aspectRatio }) => {
  const [embedData, setEmbedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOembed = async () => {
      if (!url) return;

      setLoading(true);
      setError(null);

      try {
        const response = await get(`/oembed?url=${encodeURIComponent(url)}`);
        if (response.ok) {
          const data = await response.json;
          setEmbedData(data);
        } else {
          setError('Failed to fetch video data');
        }
      } catch (err) {
        setError('Error fetching video data');
        console.error('YouTube oEmbed error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOembed();
  }, [url]);

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '1:1': return 'aspect-square';
      case '4:3': return 'aspect-[4/3]';
      case '16:9': return 'aspect-video';
      case '21:9': return 'aspect-[21/9]';
      default: return 'aspect-video';
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse bg-secondary ${getAspectRatioClass()}`} />
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded">
        {error}
      </div>
    );
  }

  if (!embedData) {
    return (
      <div className="bg-muted p-4 rounded">
        Please enter a valid YouTube URL
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className={`relative ${getAspectRatioClass()} w-full`}>
        <div 
          className="absolute inset-0"
          dangerouslySetInnerHTML={{ __html: embedData.html }}
        />
      </div>
      {embedData.title && (
        <div className="mt-2 text-sm text-muted-foreground">
          {embedData.title}
        </div>
      )}
    </div>
  );
};

export const config = {
  fields: {
    url: {
      type: "text",
      label: "Embed URL",
      description: "Enter the full oEmbedable URL",
    },
    aspectRatio: {
      type: "select",
      label: "Aspect Ratio",
      options: [
        { label: "16:9 (Widescreen)", value: "16:9" },
        { label: "4:3 (Standard)", value: "4:3" },
        { label: "1:1 (Square)", value: "1:1" },
        { label: "21:9 (Ultrawide)", value: "21:9" },
      ],
      defaultValue: "16:9",
    }
  },
  defaultProps: {
    url: "",
    aspectRatio: "16:9",
  },
};

export default YouTubeBlock;
