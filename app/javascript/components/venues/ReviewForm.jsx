import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { post } from "@rails/request.js";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const schema = z.object({
  reviewer_role: z.enum(["attendee", "musician"], { required_error: "Selecciona un tipo de reviewer" }),
  overall_rating: z
    .string()
    .min(1, "Requerido")
    .transform((v) => parseFloat(v))
    .refine((v) => !Number.isNaN(v) && v >= 0 && v <= 5, { message: "Debe estar entre 0 y 5" }),
  comment: z.string().optional().or(z.literal("")),
  // Aspects opcionales, se parsean numéricos si se llenan
  sound_quality: z.string().optional().or(z.literal("")),
  atmosphere: z.string().optional().or(z.literal("")),
  safety: z.string().optional().or(z.literal("")),
  price_value: z.string().optional().or(z.literal("")),
  sound_engineer: z.string().optional().or(z.literal("")),
  stage: z.string().optional().or(z.literal("")),
  backstage: z.string().optional().or(z.literal("")),
  equipment: z.string().optional().or(z.literal("")),
  booking_experience: z.string().optional().or(z.literal("")),
  payout_fairness: z.string().optional().or(z.literal("")),
});

export default function ReviewForm({ venueSlug, open, onOpenChange, onSuccess }) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      reviewer_role: "attendee",
      overall_rating: "",
      comment: "",
      sound_quality: "",
      atmosphere: "",
      safety: "",
      price_value: "",
      sound_engineer: "",
      stage: "",
      backstage: "",
      equipment: "",
      booking_experience: "",
      payout_fairness: "",
    },
  });

  const role = form.watch("reviewer_role");

  const attendeeAspects = useMemo(() => ([
    { name: "sound_quality", label: "Calidad de sonido" },
    { name: "atmosphere", label: "Ambiente" },
    { name: "safety", label: "Seguridad" },
    { name: "price_value", label: "Relación precio/calidad" },
  ]), []);

  const musicianAspects = useMemo(() => ([
    { name: "sound_engineer", label: "Ingeniero de sonido" },
    { name: "stage", label: "Escenario" },
    { name: "backstage", label: "Backstage" },
    { name: "equipment", label: "Equipamiento" },
    { name: "booking_experience", label: "Booking" },
    { name: "payout_fairness", label: "Pago justo" },
  ]), []);

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      // Construir aspects con solo campos numéricos validos
      const keys = role === "attendee"
        ? attendeeAspects.map((a) => a.name)
        : musicianAspects.map((a) => a.name);

      const aspects = {};
      keys.forEach((k) => {
        const raw = values[k];
        if (raw !== undefined && raw !== null && String(raw).trim() !== "") {
          const num = parseFloat(String(raw));
          if (!Number.isNaN(num)) aspects[k] = num;
        }
      });

      const payload = {
        venue_review: {
          reviewer_role: values.reviewer_role,
          overall_rating: values.overall_rating,
          comment: values.comment || null,
          aspects,
        },
      };

      const response = await post(`/venues/${venueSlug}/venue_reviews`, {
        body: payload,
        responseKind: "json",
      });

      if (response.ok) {
        await response.json; // no necesitamos usar el contenido ahora
        toast({ title: "Review enviada", description: "Gracias por tu aporte" });
        onOpenChange(false);
        form.reset();
        onSuccess?.();
      } else {
        const err = await response.json.catch(() => ({}));
        const msg = err?.errors?.join(", ") || "No se pudo enviar la review";
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Error al enviar la review", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Nueva review</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reviewer_role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="attendee">Asistente</SelectItem>
                          <SelectItem value="musician">Músico</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="overall_rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating (0-5)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="4.5"
                        inputMode="decimal"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Aspectos (opcional)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(role === "attendee" ? attendeeAspects : musicianAspects).map((a) => (
                  <FormField
                    key={a.name}
                    control={form.control}
                    name={a.name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{a.label}</FormLabel>
                        <FormControl>
                          <Input placeholder="4.5" inputMode="decimal" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comentario (opcional)</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="Escribe tu experiencia..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Enviando..." : "Enviar review"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
