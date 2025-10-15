import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { get, put } from "@rails/request.js";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ImageUploader } from "@/components/ui/image-uploader";
import { MapPicker } from "@/components/ui/map-picker";
import SimpleEditor from "@/components/ui/SimpleEditor";
import { Skeleton } from "@/components/ui/skeleton";

const schema = z.object({
  name: z.string().min(2, "Requerido"),
  city: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  capacity: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? parseInt(v, 10) : null))
    .refine((v) => v === null || (!Number.isNaN(v) && v >= 0), { message: "Debe ser un número válido" }),
  price_range: z.string().optional().or(z.literal("")),
  genres_text: z.string().optional().or(z.literal("")),
  lat: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? parseFloat(v) : null)),
  lng: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? parseFloat(v) : null)),
});

function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="px-4 sm:px-8 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-8 w-72" />
          <Card className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
              <Skeleton className="h-24 w-full md:col-span-2" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function VenuesEdit() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [coverImageSignedId, setCoverImageSignedId] = useState(null);
  const [coverImageUrl, setCoverImageUrl] = useState(null);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      city: "",
      country: "",
      description: "",
      address: "",
      capacity: "",
      price_range: "",
      genres_text: "",
      lat: "",
      lng: "",
    },
  });

  const fetchVenue = async () => {
    setLoading(true);
    try {
      const response = await get(`/venues/${slug}.json`);
      if (response.ok) {
        const data = await response.json;
        form.reset({
          name: data.name || "",
          city: data.city || "",
          country: data.country || "",
          description: data.description || "",
          address: data.address || "",
          capacity: data.capacity != null ? String(data.capacity) : "",
          price_range: data.price_range || "none",
          genres_text: Array.isArray(data.genres) ? data.genres.join(", ") : "",
          lat: data.lat != null ? String(data.lat) : "",
          lng: data.lng != null ? String(data.lng) : "",
        });
        setCoverImageUrl(data.image_url || null);
      }
    } catch (e) {
      console.error("Error loading venue:", e);
      toast({ title: "Error", description: "No se pudo cargar el venue", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const onLocationChange = (data) => {
    if (data?.address) {
      form.setValue("address", data.address || "");
    }
    if (data?.lat) form.setValue("lat", String(data.lat));
    if (data?.lng) form.setValue("lng", String(data.lng));
  };

  const onUploadComplete = (signedId, _cropData, serviceUrl) => {
    if (signedId) setCoverImageSignedId(signedId);
    if (serviceUrl) setCoverImageUrl(serviceUrl);
  };

  const onSubmit = async (values) => {
    const genres =
      values.genres_text
        ?.split(",")
        .map((g) => g.trim())
        .filter((g) => g.length > 0) || [];

    const priceRange = values.price_range && values.price_range !== 'none' ? values.price_range : null;

    const venuePayload = {
      name: values.name,
      city: values.city || null,
      country: values.country || null,
      description: values.description || null,
      address: values.address || null,
      capacity: values.capacity,
      price_range: priceRange,
      lat: values.lat,
      lng: values.lng,
      genres,
      image_url: coverImageUrl || null,
    };

    // solo enviar cover_image si subimos una nueva
    if (coverImageSignedId) {
      venuePayload.cover_image = coverImageSignedId;
    }

    const payload = { venue: venuePayload };

    try {
      const response = await put(`/venues/${slug}`, {
        body: payload,
        responseKind: "json",
      });
      if (response.ok) {
        const data = await response.json;
        toast({ title: "Actualizado", description: "Venue actualizado correctamente" });
        const slugOrId = data?.slug || data?.id || slug;
        navigate(`/venues/${slugOrId}`);
      } else {
        const err = await response.json.catch(() => ({}));
        const msg = err?.errors?.join(", ") || "No se pudo actualizar el venue";
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    } catch (e) {
      console.error("Error updating venue:", e);
      toast({ title: "Error", description: "No se pudo actualizar el venue", variant: "destructive" });
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="px-4 sm:px-8 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">Editar Venue</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Actualiza la información del local.
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate(`/venues/${slug}`)}>
              Cancelar
            </Button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Tresor" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ciudad</FormLabel>
                          <FormControl>
                            <Input placeholder="Berlin" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>País</FormLabel>
                          <FormControl>
                            <Input placeholder="Alemania" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacidad</FormLabel>
                        <FormControl>
                          <Input placeholder="1000" inputMode="numeric" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price_range"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rango de precio</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un rango" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin especificar</SelectItem>
                              <SelectItem value="$">$</SelectItem>
                              <SelectItem value="$$">$$</SelectItem>
                              <SelectItem value="$$$">$$$</SelectItem>
                              <SelectItem value="€">€</SelectItem>
                              <SelectItem value="€€">€€</SelectItem>
                              <SelectItem value="€€€">€€€</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="genres_text"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Géneros (separados por coma)</FormLabel>
                        <FormControl>
                          <Input placeholder="Techno, Industrial" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <SimpleEditor value={field.value || ""} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>

              <Card className="p-6 space-y-4">
                <h2 className="text-xl font-semibold">Imagen de portada</h2>
                <p className="text-sm text-muted-foreground">
                  Puedes reemplazar la imagen de portada.
                </p>
                <ImageUploader
                  onUploadComplete={onUploadComplete}
                  aspectRatio={16 / 9}
                  preview
                  imageUrl={coverImageUrl}
                />
              </Card>

              <Card className="p-6 space-y-6">
                <h2 className="text-xl font-semibold">Ubicación</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-3">
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Input placeholder="Köpenicker Str. 70, 10179 Berlin" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitud</FormLabel>
                        <FormControl>
                          <Input placeholder="-33.4489" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lng"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitud</FormLabel>
                        <FormControl>
                          <Input placeholder="-70.6693" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />
                <MapPicker
                  value={{
                    lat: form.getValues("lat"),
                    lng: form.getValues("lng"),
                    address: form.getValues("address"),
                  }}
                  onChange={onLocationChange}
                />
              </Card>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => navigate(`/venues/${slug}`)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar cambios</Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
