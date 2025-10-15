import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { get } from "@rails/request.js";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import ReviewList from "./ReviewList";
import ReviewForm from "./ReviewForm";
import useAuthStore from "@/stores/authStore";
import RatingsSummary from "./RatingsSummary";
import RatingsBreakdown from "./RatingsBreakdown";

function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="h-[40vh] bg-muted" />
      <div className="px-4 sm:px-8 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 md:col-span-2 space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </Card>
            <Card className="p-6 space-y-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VenueShow() {
  const { slug } = useParams();
  const { toast } = useToast();
  const { currentUser } = useAuthStore();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const loadVenue = async () => {
    setLoading(true);
    try {
      const response = await get(`/venues/${slug}.json`);
      if (response.ok) {
        const data = await response.json; // rails/request.js => response.json (property)
        setVenue(data);
      } else {
        toast({ title: "Error", description: "No se pudo cargar el venue", variant: "destructive" });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Error de red al cargar el venue", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVenue();
  }, [slug]);

  if (loading) return <Loading />;
  if (!venue) return null;

  const {
    name,
    city,
    country,
    description,
    address,
    capacity,
    price_range,
    lat,
    lng,
    rating,
    review_count,
    genres = [],
    image_url
  } = venue;

  const mapLink = lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <div className="h-[40vh] relative overflow-hidden bg-muted">
        {image_url && (
          <div
            className="absolute inset-0 bg-center bg-cover"
            style={{ backgroundImage: `url('${image_url}')` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      <section className="px-4 sm:px-8 py-6 border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">{name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {city}{city && country ? ", " : ""}{country}
            </p>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              {typeof rating !== "undefined" && rating !== null && (
                <span className="inline-flex items-center gap-1">
                  <span className="font-mono">{Number(rating).toFixed(1)}</span> rating
                </span>
              )}
              {typeof review_count !== "undefined" && (
                <>
                  <span className="opacity-50">•</span>
                  <span>{review_count} reviews</span>
                </>
              )}
              {capacity && (
                <>
                  <span className="opacity-50">•</span>
                  <span>Capacidad: {capacity}</span>
                </>
              )}
              {price_range && (
                <>
                  <span className="opacity-50">•</span>
                  <span>{price_range}</span>
                </>
              )}
            </div>
            {genres?.length ? (
              <div className="flex flex-wrap gap-2 mt-3">
                {genres.map((g) => (
                  <Badge key={g} variant="secondary" className="capitalize">{g}</Badge>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Link to="/venues">
              <Button variant="outline">Volver</Button>
            </Link>
            <Link to="/venues/new">
              <Button>Crear venue</Button>
            </Link>
            {currentUser && (
              <Button onClick={() => setReviewOpen(true)}>Escribir review</Button>
            )}
          </div>
        </div>
      </section>

      {/*<div className="px-4 sm:px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <RatingsSummary venueSlug={slug} />
        </div>
      </div>*/}

      <div className="px-4 sm:px-8 py-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 md:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">Descripción</h2>
            <Separator />
            {description ? (
              <div className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: description }} />
            ) : (
              <p className="text-muted-foreground">Sin descripción.</p>
            )}
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Información</h2>
            <RatingsBreakdown venueSlug={slug} />

            <h2 className="text-xl font-semibold">Información</h2>


            <Separator />
            <div className="space-y-2 text-sm">
              {address && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dirección</span>
                  <span className="text-right">{address}</span>
                </div>
              )}
              {(lat && lng) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coordenadas</span>
                  <span className="text-right font-mono">{lat}, {lng}</span>
                </div>
              )}
            </div>
            {mapLink && (
              <a href={mapLink} target="_blank" rel="noreferrer">
                <Button variant="secondary" className="w-full">Ver en Google Maps</Button>
              </a>
            )}
          </Card>

          <div className="md:col-span-1">

          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 pb-16">
        <div className="max-w-6xl mx-auto">
          <ReviewList venueSlug={slug} reloadToken={reloadToken} />
        </div>
      </div>

      <ReviewForm
        venueSlug={slug}
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        onSuccess={() => setReloadToken((t) => t + 1)}
      />
    </div>
  );
}
