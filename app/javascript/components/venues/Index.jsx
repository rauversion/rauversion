import React, { useEffect, useState } from "react";
import { get } from "@rails/request.js";
import VenueCard from "./VenueCard";
import { Skeleton } from "@/components/ui/skeleton";

function VenuesLoading() {
  return (
    <div className="px-4 sm:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-[4/3] rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function VenuesIndex() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const response = await get("/venues.json");
      if (response.ok) {
        const data = await response.json; // NOTE: rails-request.js uses response.json (no function)
        // If the controller returns a plain array, keep as-is.
        // If later we shape as { venues: [...] } handle both:
        setVenues(Array.isArray(data) ? data : (data.venues || []));
      }
    } catch (e) {
      console.error("Error loading venues:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  if (loading) return <VenuesLoading />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="px-4 sm:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-8">
            Explorar Locales
          </h1>

          {venues.length === 0 ? (
            <div className="text-muted-foreground">No hay locales aún.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {venues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
