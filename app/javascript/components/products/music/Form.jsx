import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Form } from "@/components/ui/form";
import Select from "react-select";
import { useThemeStore } from "@/stores/theme";
import selectTheme from "@/components/ui/selectTheme";
import SimpleEditor from "@/components/ui/SimpleEditor";
import { Checkbox } from "@/components/ui/checkbox";
import FormErrors from "../shared/FormErrors";
import PricingSection from "../shared/PricingSection";
import ShippingSection from "../shared/ShippingSection";
import PhotosSection from "../shared/PhotosSection";
import DeleteButton from "../shared/DeleteButton";
import useAuthStore from "@/stores/authStore";
import I18n from "@/stores/locales";
import { get, post, patch } from "@rails/request.js";
import PublishSection from "../shared/PublishSection";

import { MUSIC_FORMATS, CONDITIONS } from "../shared/constants";

export default function MusicForm({ product, isEditing = false }) {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();
  const [albums, setAlbums] = React.useState([]);
  const { username, slug } = useParams();

  const form = useForm({
    defaultValues: {
      category: product?.category || "",
      playlist_id: product?.playlist_id || "",
      title: product?.title || "",
      description: product?.description || "",
      condition: product?.condition || "",
      include_digital_album: product?.include_digital_album || false,
      price: product?.price || "",
      stock_quantity: product?.stock_quantity || "",
      sku: product?.sku || "",
      status: product?.status || "active",
      limited_edition: product?.limited_edition || false,
      limited_edition_count: product?.limited_edition_count || "",
      shipping_days: product?.shipping_days || "",
      shipping_begins_on: product?.shipping_begins_on || "",
      visibility: product?.visibility || "public",
      name_your_price: product?.name_your_price || false,
      quantity: product?.quantity || 1,
      product_images_attributes: product?.photos || [],
      accept_barter: product?.accept_barter || false,
      barter_description: product?.barter_description || "",
      product_shippings_attributes:
        product?.shipping_options?.map((option) => ({
          id: option.id,
          country: option.country,
          base_cost: option.base_cost,
          additional_cost: option.additional_cost,
        })) || [],
    },
  });

  React.useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await get(`/${currentUser.username}/albums.json`);
        if (response.ok) {
          const data = await response.json;
          setAlbums(data.collection);
        }
      } catch (error) {
        console.error("Error fetching albums:", error);
      }
    };

    fetchAlbums();
  }, [currentUser.username]);

  // Reset form errors when any field changes
  React.useEffect(() => {
    const subscription = form.watch(() => {
      if (Object.keys(form.formState.errors).length > 0) {
        form.clearErrors();
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (data) => {
    try {
      // Clear any existing errors before submitting
      form.clearErrors();

      let response;
      let targetUsername = isEditing ? username : currentUser.username;

      if (isEditing) {
        response = await patch(`/${targetUsername}/products/music/${slug}`, {
          responseKind: "json",
          body: { product: data },
        });
      } else {
        response = await post(`/${targetUsername}/products/music`, {
          responseKind: "json",
          body: { product: data },
        });
      }

      const result = await response.json;

      if (response.ok) {
        navigate(`/${targetUsername}/products/${result.product.slug}`);
      } else {
        // Set field errors from backend
        Object.keys(result.errors).forEach((key) => {
          form.setError(key, {
            type: "backend",
            message: result.errors[key].join(", "),
          });
        });
      }
    } catch (error) {
      console.error(
        `Failed to ${isEditing ? "update" : "create"} product:`,
        error
      );
      form.setError("root", {
        type: "backend",
        message: "An unexpected error occurred",
      });
    }
  };

  const limitedEdition = form.watch("limited_edition");
  const digitalIncluded = form.watch("include_digital_album");

  return (
    <div className="m-4 rounded-lg border border-default bg-card text-card-foreground shadow-sm">
      <div className="p-6 pt-0 space-y-6">
        <h2 className="text-2xl py-4 font-bold flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              navigate(
                `/${isEditing ? username : currentUser.username}/products`
              )
            }
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          {isEditing
            ? I18n.t("products.music.edit.title")
            : I18n.t("products.music.new.title")}
        </h2>

        <FormErrors errors={form.formState.errors} />

        <PublishSection
          control={form.control}
          setValue={form.setValue}
          watch={form.watch}
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-5 gap-4 grid-cols-1">
              <div className="block pt-0 space-y-3 md:col-span-2">
                <FormField
                  control={form.control}
                  name="title"
                  rules={{ required: "Title is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {I18n.t("products.music.form.title")}
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-2">
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {I18n.t("products.music.form.format")}
                          </FormLabel>
                          <FormControl>
                            <Select
                              id="category"
                              placeholder={I18n.t(
                                "products.music.form.select_format"
                              )}
                              options={MUSIC_FORMATS}
                              value={MUSIC_FORMATS.find(
                                (f) => f.value === field.value
                              )}
                              onChange={(option) =>
                                field.onChange(option?.value)
                              }
                              theme={(theme) => selectTheme(theme, isDarkMode)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="condition"
                      rules={{ required: "Condition is required" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {I18n.t("products.gear.form.condition")}
                          </FormLabel>
                          <FormControl>
                            <Select
                              id="condition"
                              placeholder={I18n.t(
                                "products.gear.form.select_condition"
                              )}
                              options={Object.keys(CONDITIONS).map((key) => ({
                                value: key,
                                label: CONDITIONS[key],
                              }))}
                              value={
                                field.value
                                  ? {
                                    value: field.value,
                                    label: CONDITIONS[field.value],
                                  }
                                  : null
                              }
                              onChange={(option) =>
                                field.onChange(option?.value)
                              }
                              theme={(theme) => selectTheme(theme, isDarkMode)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="limited_edition"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>
                            {I18n.t("products.merch.form.limited_edition")}
                          </FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {limitedEdition && (
                      <FormField
                        control={form.control}
                        name="limited_edition_count"
                        rules={{
                          required: "Limited edition count is required",
                          min: {
                            value: 1,
                            message: "Count must be at least 1",
                          },
                        }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {I18n.t(
                                "products.merch.form.limited_edition_count"
                              )}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(e.target.valueAsNumber)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="include_digital_album"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>
                            {I18n.t("products.music.form.include_digital")}
                          </FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {digitalIncluded && (
                      <FormField
                        control={form.control}
                        name="playlist_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {I18n.t("products.music.form.album")}
                            </FormLabel>
                            <FormControl>
                              <Select
                                id="playlist_id"
                                placeholder={I18n.t(
                                  "products.music.form.select_album"
                                )}
                                options={albums.map((album) => ({
                                  value: album.id,
                                  label: album.title,
                                }))}
                                value={albums
                                  .map((album) => ({
                                    value: album.id,
                                    label: album.title,
                                  }))
                                  .find((a) => a.value === field.value)}
                                onChange={(option) =>
                                  field.onChange(option?.value)
                                }
                                theme={(theme) =>
                                  selectTheme(theme, isDarkMode)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {I18n.t("products.music.form.description")}
                      </FormLabel>
                      <FormControl>
                        <SimpleEditor
                          value={field.value}
                          onChange={field.onChange}
                          scope="product"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col flex-grow md:col-span-3 col-span-1 space-y-6">
                <PricingSection
                  control={form.control}
                  form={form}
                  showLimitedEdition
                />
                <PhotosSection
                  control={form.control}
                  setValue={form.setValue}
                  watch={form.watch}
                />
                <ShippingSection control={form.control} />

                <div className="flex flex-col md:flex-row gap-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting
                      ? I18n.t("products.form.submitting")
                      : isEditing
                        ? I18n.t("products.form.update")
                        : I18n.t("products.form.submit")}
                  </Button>
                  {isEditing && <DeleteButton product={product} />}
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
