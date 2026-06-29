import React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import {
  BadgeDollarSign,
  ChevronLeft,
  GraduationCap,
  Headphones,
  Mic2,
  Plus,
  Sparkles,
  Trash2,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FormErrors from "../shared/FormErrors";
import PricingSection from "../shared/PricingSection";
import PhotosSection from "../shared/PhotosSection";
import DeleteButton from "../shared/DeleteButton";
import useAuthStore from "@/stores/authStore";
import I18n from "@/stores/locales";
import { post, patch } from "@rails/request.js";
import PublishSection from "../shared/PublishSection";

import {
  BOOKING_MODES,
  SERVICE_KIND_OPTIONS,
  SERVICE_TYPES,
  DELIVERY_METHODS,
} from "../shared/constants";

const SERVICE_KIND_ICONS = {
  advisory: Sparkles,
  education: GraduationCap,
  performance: Mic2,
  studio_service: Headphones,
};

const PRICE_RULE_TYPES = [
  { value: "base", label: I18n.t("products.service.price_rule_types.base") },
  { value: "extra_hour", label: I18n.t("products.service.price_rule_types.extra_hour") },
  { value: "travel", label: I18n.t("products.service.price_rule_types.travel") },
  { value: "rider", label: I18n.t("products.service.price_rule_types.rider") },
  { value: "deposit", label: I18n.t("products.service.price_rule_types.deposit") },
  { value: "custom", label: I18n.t("products.service.price_rule_types.custom") },
];

const blankPriceRule = {
  name: "",
  rule_type: "custom",
  amount: 0,
  currency: "usd",
  duration_minutes: "",
  location_scope: "",
  min_notice_days: "",
  active: true,
  position: 0,
  _destroy: false,
};

function serviceKindForCategory(category) {
  return SERVICE_TYPES.find((type) => type.value === category)?.serviceKind || "advisory";
}

function ServiceKindSelector({ value, onChange }) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {SERVICE_KIND_OPTIONS.map((option) => {
        const Icon = SERVICE_KIND_ICONS[option.value] || Wrench;
        const selected = value === option.value;

        return (
          <button
            type="button"
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`group flex min-h-[132px] flex-col justify-between rounded-lg border p-4 text-left transition ${
              selected
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-background hover:border-primary/60 hover:bg-muted/50"
            }`}
          >
            <span className="flex items-center justify-between">
              <Icon className="h-5 w-5" />
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  selected ? "bg-primary-foreground" : "bg-muted-foreground/30"
                }`}
              />
            </span>
            <span>
              <span className="block text-base font-semibold">{option.label}</span>
              <span
                className={`mt-1 block text-xs leading-5 ${
                  selected ? "text-primary-foreground/80" : "text-muted-foreground"
                }`}
              >
                {option.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ServicePricingRules({ form }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "service_price_rules_attributes",
    keyName: "fieldId",
  });
  const watchedRules = form.watch("service_price_rules_attributes") || [];
  const productCurrency = form.watch("currency") || "clp";

  const removeRule = (index) => {
    const persistedId = form.getValues(`service_price_rules_attributes.${index}.id`);

    if (persistedId) {
      form.setValue(`service_price_rules_attributes.${index}._destroy`, true, {
        shouldDirty: true,
      });
    } else {
      remove(index);
    }
  };

  const visibleRules = fields
    .map((field, index) => ({ field, index }))
    .filter(({ index }) => !watchedRules[index]?._destroy);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <BadgeDollarSign className="h-5 w-5" />
            {I18n.t("products.service.form.price_rules.title")}
          </CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            {I18n.t("products.service.form.price_rules.description")}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ ...blankPriceRule, currency: productCurrency, position: fields.length })}
        >
          <Plus className="mr-2 h-4 w-4" />
          {I18n.t("products.service.form.price_rules.add")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {visibleRules.map(({ field, index }) => (
          <div key={field.fieldId} className="rounded-lg border border-border bg-background p-4">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="text-sm font-medium">
                {I18n.t("products.service.form.price_rules.rule", { number: index + 1 })}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeRule(index)}
                aria-label={I18n.t("products.service.form.price_rules.remove")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name={`service_price_rules_attributes.${index}.name`}
                rules={{ required: I18n.t("products.service.form.errors.rule_name_required") }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{I18n.t("products.service.form.price_rules.name")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={I18n.t("products.service.form.price_rules.name_placeholder")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`service_price_rules_attributes.${index}.rule_type`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{I18n.t("products.service.form.price_rules.type")}</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {PRICE_RULE_TYPES.map((ruleType) => (
                          <option key={ruleType.value} value={ruleType.value}>
                            {ruleType.label}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`service_price_rules_attributes.${index}.amount`}
                rules={{
                  min: {
                    value: 0,
                    message: I18n.t("products.service.form.errors.amount_min"),
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{I18n.t("products.service.form.price_rules.amount")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        {...field}
                        onChange={(event) => field.onChange(event.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`service_price_rules_attributes.${index}.currency`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{I18n.t("products.service.form.price_rules.currency")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={I18n.t("products.service.form.price_rules.currency_placeholder")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`service_price_rules_attributes.${index}.duration_minutes`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{I18n.t("products.service.form.price_rules.duration_minutes")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="15"
                        {...field}
                        onChange={(event) => field.onChange(event.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`service_price_rules_attributes.${index}.min_notice_days`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{I18n.t("products.service.form.price_rules.min_notice_days")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(event) => field.onChange(event.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name={`service_price_rules_attributes.${index}.location_scope`}
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>{I18n.t("products.service.form.price_rules.location_scope")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={I18n.t("products.service.form.price_rules.location_scope_placeholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function ServiceForm({ product, isEditing = false }) {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();
  const { username, slug } = useParams();
  const initialServiceKind =
    product?.service_kind || serviceKindForCategory(product?.category) || "advisory";
  const initialPriceRules =
    product?.service_price_rules?.map((rule) => ({
      id: rule.id,
      name: rule.name || "",
      rule_type: rule.rule_type || "custom",
      amount: rule.amount || 0,
      currency: rule.currency || "usd",
      duration_minutes: rule.duration_minutes || "",
      location_scope: rule.location_scope || "",
      min_notice_days: rule.min_notice_days || "",
      active: rule.active ?? true,
      position: rule.position || 0,
      _destroy: false,
    })) || [
      {
        ...blankPriceRule,
        name: I18n.t("products.service.form.price_rules.base_price"),
        rule_type: "base",
        amount: product?.price || 0,
        currency: product?.currency || "clp",
      },
    ];

  const form = useForm({
    defaultValues: {
      service_kind: initialServiceKind,
      category: product?.category || "",
      booking_mode: product?.booking_mode || "instant_checkout",
      delivery_method: product?.delivery_method || "",
      title: product?.title || "",
      description: product?.description || "",
      currency: product?.currency || "clp",
      duration_minutes: product?.duration_minutes || 60,
      max_participants: product?.max_participants || 1,
      prerequisites: product?.prerequisites || "",
      what_to_expect: product?.what_to_expect || "",
      cancellation_policy: product?.cancellation_policy || "",
      post_purchase_instructions: product?.post_purchase_instructions || "",
      price: product?.price || "",
      stock_quantity: product?.stock_quantity || "",
      status: product?.status || "active",
      visibility: product?.visibility || "public",
      name_your_price: product?.name_your_price || false,
      quantity: product?.quantity || 1,
      performance_format: product?.performance_format || "",
      home_city: product?.home_city || "",
      home_country: product?.home_country || "",
      available_countries: product?.available_countries || "",
      technical_rider: product?.technical_rider || "",
      hospitality_rider: product?.hospitality_rider || "",
      price_notes: product?.price_notes || "",
      service_price_rules_attributes: initialPriceRules,
      product_images_attributes: product?.photos || product?.product_images || [],
      shipping_days: product?.shipping_days || "",
      shipping_begins_on: product?.shipping_begins_on || "",
      product_shippings_attributes:
        product?.shipping_options?.map((option) => ({
          id: option.id,
          country: option.country,
          base_cost: option.base_cost,
          additional_cost: option.additional_cost,
        })) || [],
    },
  });

  const serviceKind = form.watch("service_kind");
  const filteredServiceTypes = SERVICE_TYPES.filter(
    (type) => type.serviceKind === serviceKind
  );

  const handleServiceKindChange = (value) => {
    form.setValue("service_kind", value, { shouldDirty: true, shouldValidate: true });

    const currentCategory = form.getValues("category");
    const categoryStillValid = SERVICE_TYPES.some(
      (type) => type.value === currentCategory && type.serviceKind === value
    );

    if (!categoryStillValid) {
      form.setValue("category", SERVICE_TYPES.find((type) => type.serviceKind === value)?.value || "", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

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
        response = await patch(`/${targetUsername}/products/service/${slug}`, {
          responseKind: "json",
          body: { product: data },
        });
      } else {
        response = await post(`/${targetUsername}/products/service`, {
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
        message: I18n.t("products.service.form.errors.unexpected"),
      });
    }
  };

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
            ? I18n.t("products.service.edit.title")
            : I18n.t("products.service.new.title")}
        </h2>

        <FormErrors errors={form.formState.errors} />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <PublishSection
              control={form.control}
              setValue={form.setValue}
              watch={form.watch}
            />
            <Card>
              <CardHeader>
                <CardTitle>{I18n.t("products.service.form.service_type")}</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="service_kind"
                  rules={{ required: I18n.t("products.service.form.errors.service_type_required") }}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ServiceKindSelector
                          value={field.value}
                          onChange={(value) => {
                            field.onChange(value);
                            handleServiceKindChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <div className="grid md:grid-cols-5 gap-4 grid-cols-1">
              <div className="block pt-0 space-y-3 md:col-span-2">
                <FormField
                  control={form.control}
                  name="title"
                  rules={{ required: I18n.t("products.service.form.errors.title_required") }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {I18n.t("products.service.form.title")}
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex-1">
                  <FormField
                    control={form.control}
                    name="category"
                    rules={{ required: I18n.t("products.service.form.errors.category_required") }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {I18n.t("products.service.form.category")}
                        </FormLabel>
                        <FormControl>
                          <Select
                            id="category"
                            placeholder={I18n.t(
                              "products.service.form.select_category"
                            )}
                            options={filteredServiceTypes}
                            value={filteredServiceTypes.find(
                              (t) => t.value === field.value
                            )}
                            onChange={(option) => field.onChange(option?.value)}
                            theme={(theme) => selectTheme(theme, isDarkMode)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
	                  />
	                </div>

                <div className="flex-1">
                  <FormField
                    control={form.control}
                    name="booking_mode"
                    rules={{ required: I18n.t("products.service.form.errors.booking_mode_required") }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{I18n.t("products.service.form.booking_mode")}</FormLabel>
                        <FormControl>
                          <Select
                            id="booking_mode"
                            placeholder={I18n.t("products.service.form.select_booking_mode")}
                            options={BOOKING_MODES}
                            value={BOOKING_MODES.find(
                              (mode) => mode.value === field.value
                            )}
                            onChange={(option) => field.onChange(option?.value)}
                            theme={(theme) => selectTheme(theme, isDarkMode)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex space-x-2">
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="delivery_method"
                      rules={{ required: I18n.t("products.service.form.errors.delivery_method_required") }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {I18n.t("products.service.form.delivery_method")}
                          </FormLabel>
                          <FormControl>
                            <Select
                              id="delivery_method"
                              placeholder={I18n.t(
                                "products.service.form.select_delivery_method"
                              )}
                              options={DELIVERY_METHODS}
                              value={DELIVERY_METHODS.find(
                                (m) => m.value === field.value
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
                  </div>

                  <FormField
                      control={form.control}
                      name="duration_minutes"
                      rules={{
                      required: I18n.t("products.service.form.errors.duration_required"),
                      min: {
                        value: 15,
                        message: I18n.t("products.service.form.errors.duration_min"),
                      },
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {I18n.t("products.service.form.duration")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="15"
                            step="15"
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
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {I18n.t("products.service.form.description")}
                      </FormLabel>
                      <FormControl>
                        <SimpleEditor
                          value={field.value}
                          onChange={field.onChange}
                          aiPromptContext="This is an AI text enhancer for a music service product."
                          scope="product"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {serviceKind === "education" && (
                    <FormField
                      control={form.control}
                      name="max_participants"
                      rules={{
                        required: I18n.t("products.service.form.errors.max_participants_required"),
                        min: {
                          value: 1,
                          message: I18n.t("products.service.form.errors.max_participants_min"),
                        },
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {I18n.t("products.service.form.max_participants")}
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
                </div>

                {serviceKind === "performance" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{I18n.t("products.service.form.show_details.title")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="performance_format"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{I18n.t("products.service.form.show_details.performance_format")}</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder={I18n.t("products.service.form.show_details.performance_format_placeholder")}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="available_countries"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{I18n.t("products.service.form.show_details.available_countries")}</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder={I18n.t("products.service.form.show_details.available_countries_placeholder")}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="home_city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{I18n.t("products.service.form.show_details.home_city")}</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="home_country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{I18n.t("products.service.form.show_details.home_country")}</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="technical_rider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{I18n.t("products.service.form.show_details.technical_rider")}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={I18n.t("products.service.form.show_details.technical_rider_placeholder")}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="hospitality_rider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{I18n.t("products.service.form.show_details.hospitality_rider")}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={I18n.t("products.service.form.show_details.hospitality_rider_placeholder")}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}

                <PhotosSection
                  control={form.control}
                  setValue={form.setValue}
                  watch={form.watch}
                />
              </div>

              <div className="flex flex-col flex-grow md:col-span-3 col-span-1 space-y-6">
                <PricingSection
                  control={form.control}
                  form={form}
                  isPriceOnly={true}
                />

                <ServicePricingRules form={form} />

                <Card>
                  <CardHeader>
                    <CardTitle>
                      {I18n.t("products.service.form.details")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="prerequisites"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {I18n.t("products.service.form.prerequisites")}
                          </FormLabel>
                          <FormControl>
                            <SimpleEditor
                              value={field.value}
                              onChange={field.onChange}
                              scope="product"
                              aiPromptContext="This is an AI text enhancer for a music service product, this is a text for the services prerequisites"
                              plain={false}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="what_to_expect"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {I18n.t("products.service.form.what_to_expect")}
                          </FormLabel>
                          <FormControl>
                            <SimpleEditor
                              value={field.value}
                              onChange={field.onChange}
                              scope="product"
                              aiPromptContext="This is an AI text enhancer for a music service product. This is the text for a what to expect for the clients"
                              plain={false}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cancellation_policy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {I18n.t(
                              "products.service.form.cancellation_policy"
                            )}
                          </FormLabel>
                          <FormControl>
                            <SimpleEditor
                              value={field.value}
                              onChange={field.onChange}
                              scope="product"
                              aiPromptContext="This is an AI text enhancer for a music service product. This is the text for the cancellation policy"
                              plain
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />


                    <FormField
                      control={form.control}
                      name="post_purchase_instructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {I18n.t(
                              "products.service.form.post_purchase_instructions"
                            )}
                          </FormLabel>
                          <FormControl>
                            <SimpleEditor
                              value={field.value}
                              onChange={field.onChange}
                              scope="product"
                              aiPromptContext="This is an AI text enhancer for the post purchase instructions to be sent to the buyer. This is the text for the instructions policy"
                              plain
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>



                <div className="flex flex-col md:flex-row gap-4">
                  <Button
                    type="submit"
                    className="w-full"
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
