import React, { useEffect, useMemo, useState } from "react";
import { get } from "@rails/request.js";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";

function Loading() {
  return (
    <Card className="p-6 space-y-4">
      <Skeleton className="h-6 w-48" />
      <div className="flex items-baseline gap-3">
        <Skeleton className="h-10 w-16" />
        <Skeleton className="h-6 w-6" />
      </div>
      <Skeleton className="h-4 w-40" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-10" />
          </div>
        ))}
      </div>
      <Skeleton className="h-5 w-56" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-4 w-48" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-4" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function RatingsBreakdown({ venueSlug }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const response = await get(`/venues/${venueSlug}/venue_reviews/summary.json`);
      if (response.ok) {
        const json = await response.json;
        setData(json);
      }
    } catch (e) {
      console.error("Error loading breakdown:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueSlug]);

  const total = data?.total_reviews || 0;
  const overall = typeof data?.overall_avg === "number" ? data.overall_avg : null;
  const starCounts = useMemo(() => {
    const counts = data?.star_counts || {};
    const result = {};
    for (let s = 1; s <= 5; s += 1) {
      result[s] = counts[s] || 0;
    }
    return result;
  }, [data]);

  const aspects = useMemo(() => data?.aspects || [], [data]);

  if (loading) return <Loading />;
  if (!data) return null;

  const pct = (n) => (total > 0 ? (n / total) * 100 : 0);

  return (
    <>
      <h3 className="text-xl font-semibold">Puntuación general</h3>

      <div className="flex items-baseline gap-3">
        <div className="text-4xl font-extrabold tabular-nums">
          {overall !== null ? overall.toFixed(1) : "-"}
        </div>
        <Star className="h-6 w-6 text-foreground/80" />
      </div>

      <div className="text-sm text-muted-foreground">
        Basado en {total} {total === 1 ? "evaluación" : "evaluaciones"}
      </div>

      {/* Star distribution bars (5..1) */}
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((s) => {
          const count = starCounts[s] || 0;
          const width = `${pct(count)}%`;
          return (
            <div key={s} className="flex items-center gap-3">
              <div className="w-6 text-sm tabular-nums text-muted-foreground">{s}</div>
              <div className="flex-1 h-2 rounded bg-muted">
                <div
                  className="h-2 rounded bg-primary"
                  style={{ width }}
                />
              </div>
              <div className="w-12 text-right text-xs tabular-nums text-muted-foreground">
                {count}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-4">
        <h4 className="text-sm font-medium">Puntuaciones detalladas</h4>
      </div>

      <div className="space-y-2">
        {aspects.length === 0 ? (
          <div className="text-sm text-muted-foreground">Sin datos por categoría.</div>
        ) : (
          aspects.map((a) => (
            <div
              key={a.name}
              className="flex items-center justify-between py-1"
            >
              <div className="text-sm capitalize">{String(a.name || "").replace(/_/g, " ")}</div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium tabular-nums">
                  {typeof a.avg === "number" ? a.avg.toFixed(1) : "-"}
                </span>
                <Star className="h-4 w-4 text-foreground/80" />
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
