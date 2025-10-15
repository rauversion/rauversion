import React, { useEffect, useState, useMemo } from "react";
import { get } from "@rails/request.js";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function Loading() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-12" />
          </div>
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-16 w-full" />
        </Card>
      ))}
    </div>
  );
}

export default function ReviewList({ venueSlug, reloadToken }) {
  const [reviews, setReviews] = useState([]);
  const [role, setRole] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchReviews = async (filterRole) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterRole && filterRole !== "all") params.set("reviewer_role", filterRole);
      const response = await get(`/venues/${venueSlug}/venue_reviews.json${params.toString() ? `?${params.toString()}` : ""}`);
      if (response.ok) {
        const data = await response.json;
        setReviews(data.reviews || []);
      }
    } catch (e) {
      console.error("Error loading reviews:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueSlug, role, reloadToken]);

  const hasReviews = useMemo(() => (reviews?.length || 0) > 0, [reviews]);

  if (loading) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Reviews</h2>
        <div className="w-48">
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="attendee">Asistentes</SelectItem>
              <SelectItem value="musician">Músicos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!hasReviews ? (
        <p className="text-sm text-muted-foreground">Sé el primero en escribir una review.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">{r.reviewer_role}</Badge>
                  {r.user && (
                    <span className="text-sm text-muted-foreground">
                      {r.user.username || [r.user.first_name, r.user.last_name].filter(Boolean).join(" ")}
                    </span>
                  )}
                </div>
                <div className="px-2 py-1 rounded-md text-xs font-mono bg-muted">
                  {typeof r.overall_rating === "number" ? r.overall_rating.toFixed(1) : "-"}
                </div>
              </div>

              {r.comment && (
                <div className="text-sm text-foreground/90 whitespace-pre-wrap mb-3">
                  {r.comment}
                </div>
              )}

              {r.aspects && Object.keys(r.aspects).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(r.aspects).map(([k, v]) => (
                    <Badge key={k} variant="outline" className="text-xs">
                      {k.replace(/_/g, " ")}: {typeof v === "number" ? v.toFixed(1) : v}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
