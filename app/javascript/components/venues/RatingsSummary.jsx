import React, { useEffect, useState, useMemo } from "react";
import { get } from "@rails/request.js";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";

/**
 * RatingsSummary
 * - Muestra el resumen de ratings:
 *   - Línea de tendencia por año (promedio overall_rating)
 *   - Bloques con promedios por categoría (aspects)
 *   - Totales y desglose por tipo (attendee/musician)
 *
 * API: GET /venues/:slug/venue_reviews/summary.json
 * {
 *   venue_id, overall_avg, total_reviews, role_counts,
 *   trend: [{year: "2023", rating: 3.7}, ...],
 *   aspects: [{name, avg, count}, ...]
 * }
 */
export default function RatingsSummary({ venueSlug }) {
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
      console.error("Error loading ratings summary:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueSlug]);

  const trend = useMemo(() => {
    if (!data?.trend) return [];
    // Asegurar orden por año ascendente
    return [...data.trend].sort((a, b) => String(a.year).localeCompare(String(b.year)));
  }, [data]);

  const aspects = useMemo(() => {
    if (!data?.aspects) return [];
    return data.aspects;
  }, [data]);

  if (loading) {
    return (
      <Card className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-48 w-full rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-5 w-56 mb-2" />
              <Skeleton className="h-4 w-24" />
            </Card>
          ))}
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const ratingDisplay = (val) =>
    typeof val === "number" ? val.toFixed(2) : "-";

  const config = {
    rating: {
      label: "Promedio anual",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold">Resumen de puntuaciones</h2>
        <p className="text-sm text-muted-foreground">
          La calificación se calcula con base en {data?.total_reviews || 0} evaluaciones y puede cambiar.
        </p>
      </div>

      {/* Trend line */}
      <ChartContainer config={config} className="w-full aspect-[3/1] bg-muted/30 rounded-lg">
        <ResponsiveContainer>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fill: "currentColor", opacity: 0.6 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 5]}
              tick={{ fill: "currentColor", opacity: 0.6 }}
              axisLine={false}
              tickLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="rating"
              stroke="var(--color-rating, hsl(var(--primary)))"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Totals and roles */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-muted">
          <Star className="h-4 w-4 text-foreground/80" />
          <span className="text-sm">Promedio global:</span>
          <span className="font-mono">{ratingDisplay(data?.overall_avg)}</span>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-muted">
          <span className="text-sm">Total reviews:</span>
          <span className="font-mono">{data?.total_reviews || 0}</span>
        </div>
        {data?.role_counts &&
          Object.entries(data.role_counts).map(([k, v]) => (
            <Badge key={k} variant="secondary" className="capitalize">
              {k}: {v}
            </Badge>
          ))}
      </div>

      {/* Categories grid */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium">Explorar evaluaciones por categoría</h3>
        {(!aspects || aspects.length === 0) ? (
          <p className="text-sm text-muted-foreground">Aún no hay suficientes datos por categoría.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aspects.map((a) => (
              <Card
                key={a.name}
                className="px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="text-sm capitalize">{a.name.replace(/_/g, " ")}</div>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{ratingDisplay(a.avg)}</span>
                  <Star className="h-4 w-4 text-foreground/80" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
