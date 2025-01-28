import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import PlaylistSelector from './PlaylistSelector';
import CheckboxField from './CheckboxField';
import PlaylistComponent from '../playlist';

const Slider = ({ 
  playlistIds = [],
  autoPlay = false,
  interval = 5000,
  itemsToShow = 4,
  openAsComponent = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (playlistIds.length === 0) return;
      
      try {
        const userId = document.querySelector('meta[name="current-user-id"]')?.content;
        const releaseId = document.querySelector('meta[name="current-release-id"]')?.content;

        if (!userId) {
          console.error('No user ID found');
          setLoading(false);
          return;
        }

        const response = await fetch(`/releases/${releaseId}.json`);
        const data = await response.json();
        setPlaylists(data.release_playlists);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching playlists:', error);
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, [playlistIds]);

  useEffect(() => {
    if (autoPlay && playlists.length > itemsToShow) {
      const timer = setInterval(() => {
        next();
      }, interval);

      return () => clearInterval(timer);
    }
  }, [autoPlay, interval, playlists.length, itemsToShow]);

  const previous = () => {
    setCurrentIndex((current) => 
      current === 0 ? Math.max(0, playlists.length - itemsToShow) : Math.max(0, current - 1)
    );
  };

  const next = () => {
    setCurrentIndex((current) => 
      current >= playlists.length - itemsToShow ? 0 : current + 1
    );
  };

  const goToSlide = (index) => {
    setCurrentIndex(Math.min(index * itemsToShow, playlists.length - itemsToShow));
  };

  if (loading) {
    return <div className="text-gray-500">Loading slider...</div>;
  }

  if (!playlists.length) {
    return <div className="text-gray-500">No playlists selected</div>;
  }

  const totalSlides = Math.ceil(playlists.length / itemsToShow);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 my-4">
      <div 
        aria-roledescription="carousel" 
        className="relative w-full" 
        role="region">
        <div className="overflow-hidden">
          <div 
            className="flex -ml-2 md:-ml-4 transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)`
            }}
          >
            {playlists.map((playlist) => (
              <div 
                key={playlist.id}
                aria-roledescription="slide" 
                className="w-1/2 md:w-1/3 lg:w-1/4 min-w-[200px] shrink-0 grow-0 pl-2 md:pl-4" 
                role="group"
                style={{ flex: `0 0 ${100 / itemsToShow}%` }}
              >
                {openAsComponent ? (
                  <div 
                    className="aspect-square bg-white/10 cursor-pointer hover:bg-white/20 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg rounded-lg overflow-hidden block relative"
                    onClick={() => {
                      const playerWidget = document.getElementById('player_widget');
                      if (playerWidget) {
                        const root = document.createElement('div');
                        playerWidget.innerHTML = '';
                        playerWidget.appendChild(root);
                        createRoot(root).render(
                          <PlaylistComponent playlistId={playlist.id} />
                        );
                      }
                    }}
                  >
                    {playlist.cover_url && (
                      <div className="relative w-full aspect-square">
                        <img 
                          src={playlist.cover_url} 
                          alt={playlist.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <div className="text-white font-bold">
                        {playlist.title}
                      </div>
                      <div className="text-white/60 text-sm">
                        {playlist.playlist_type} • {new Date(playlist.release_date).getFullYear()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <a 
                    href={`/playlists/${playlist.id}`}
                    data-turbo-frame="player_widget"
                    className="aspect-square bg-white/10 cursor-pointer hover:bg-white/20 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg rounded-lg overflow-hidden block relative"
                  >
                    {playlist.cover_url && (
                      <div className="relative w-full aspect-square">
                        <img 
                          src={playlist.cover_url} 
                          alt={playlist.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <div className="text-white font-bold">
                        {playlist.title}
                      </div>
                      <div className="text-white/60 text-sm">
                        {playlist.playlist_type} • {new Date(playlist.release_date).getFullYear()}
                      </div>
                    </div>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {playlists.length > itemsToShow && (
          <>
            <button 
              onClick={previous}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-white/20 bg-black/50 hover:bg-white/20 text-white absolute h-8 w-8 rounded-full -left-5 top-1/2 -translate-y-1/2 backdrop-blur-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left h-4 w-4">
                <path d="m12 19-7-7 7-7"></path>
                <path d="M19 12H5"></path>
              </svg>
              <span className="sr-only">Previous slide</span>
            </button>
            <button 
              onClick={next}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-white/20 bg-black/50 hover:bg-white/20 text-white absolute h-8 w-8 rounded-full -right-5 top-1/2 -translate-y-1/2 backdrop-blur-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right h-4 w-4">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
              <span className="sr-only">Next slide</span>
            </button>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button 
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 hover:bg-white/50 ${
                    Math.floor(currentIndex / itemsToShow) === index ? 'bg-white' : 'bg-white/30'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div id="player_widget" className="mt-4"></div>
    </div>
  );
};

export const config = {
  fields: {
    playlistIds: {
      type: "custom",
      render: PlaylistSelector,
      label: "Select Playlists"
    },
    autoPlay: {
      type: "custom",
      render: CheckboxField,
      label: "Enable Auto Play"
    },
    interval: {
      type: "number",
      label: "Slide Interval (ms)"
    },
    itemsToShow: {
      type: "select",
      label: "Items to Show",
      options: [
        { label: "2 Items", value: 2 },
        { label: "3 Items", value: 3 },
        { label: "4 Items", value: 4 },
        { label: "5 Items", value: 5 }
      ]
    },
    openAsComponent: {
      type: "custom",
      render: CheckboxField,
      label: "Open as React Component"
    }
  },
  defaultProps: {
    playlistIds: [],
    autoPlay: false,
    interval: 5000,
    itemsToShow: 4,
    openAsComponent: false
  }
};

export default Slider;
