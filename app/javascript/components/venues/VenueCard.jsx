import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function VenueCard({ venue }) {
  const {
    id,
    slug,
    name,
    city,
    country,
    capacity,
    price_range,
    rating,
    review_count,
    genres = [],
    image_url
  } = venue || {};

  const linkTo = `/venues/${slug || id}`;

  return (
    <Link to={linkTo} className="block group">
      <Card className="overflow-hidden bg-card text-card-foreground border-border hover:border-accent transition-all hover:shadow-lg">
        <div className="aspect-[4/3] relative overflow-hidden bg-muted">
          <div
            className="absolute inset-0 bg-center bg-cover transition-transform duration-300 group-hover:scale-105"
            style={image_url ? { backgroundImage: `url('${image_url}')` } : undefined}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          {typeof rating !== "undefined" && rating !== null && (
            <div className="absolute top-3 right-3">
              <span className="px-2 py-1 rounded-md text-xs font-mono bg-background/80 text-foreground border border-border">
                {Number(rating).toFixed(1)}
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold tracking-tight line-clamp-1">
            {name}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {city}{city && country ? ", " : ""}{country}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-3 text-muted-foreground">
            {capacity ? (
              <span className="text-[11px]">
                Capacidad: {capacity}
              </span>
            ) : null}
            {price_range ? (
              <>
                <span className="text-[11px] opacity-60">•</span>
                <span className="text-[11px]">{price_range}</span>
              </>
            ) : null}
          </div>

          {genres?.length ? (
            <div className="flex flex-wrap gap-2 mt-3">
              {genres.slice(0, 3).map((g) => (
                <Badge
                  key={g}
                  variant="secondary"
                  className="capitalize"
                >
                  {g}
                </Badge>
              ))}
              {genres.length > 3 && (
                <Badge variant="outline">
                  +{genres.length - 3}
                </Badge>
              )}
            </div>
          ) : null}

          <div className="mt-3 text-xs text-muted-foreground">
            {review_count ? `${review_count} reviews` : "Sin reviews"}
          </div>
        </div>
      </Card>
    </Link>
  );
}
