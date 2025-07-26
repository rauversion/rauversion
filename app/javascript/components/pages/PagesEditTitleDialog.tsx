import React from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { put } from "@rails/request.js";

type EditPageForm = {
  title: string;
  slug: string;
  published: boolean;
  menu: string;
};

export default function PagesEditTitleDialog({
  pageId,
  currentTitle,
  currentSlug,
  currentPublished,
  currentMenu,
  onUpdated,
}: {
  pageId: number;
  currentTitle: string;
  currentSlug: string;
  currentPublished: boolean;
  currentMenu: string;
  onUpdated?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EditPageForm>({
    defaultValues: {
      title: currentTitle,
      slug: currentSlug,
      published: currentPublished,
      menu: currentMenu,
    }
  });

  React.useEffect(() => {
    reset({
      title: currentTitle,
      slug: currentSlug,
      published: currentPublished,
      menu: currentMenu,
    });
  }, [currentTitle, currentSlug, currentPublished, currentMenu, reset]);

  const onSubmit = async (data: EditPageForm) => {
    const response = await put(`/pages/${pageId}.json`, {
      body: JSON.stringify({
        page: {
          title: data.title,
          slug: data.slug,
          published: data.published,
          menu: data.menu,
        }
      }),
      responseKind: "json"
    });

    if (response.ok) {
      toast({ title: "Page updated" });
      setOpen(false);
      onUpdated && onUpdated();
    } else {
      // @ts-ignore
      const errors = response.json?.errors || ["Unknown error"];
      toast({
        title: "Error updating page",
        description: Array.isArray(errors) ? errors.join(", ") : String(errors),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">Edit Title</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Page Title</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block mb-1">Title</label>
            <Input {...register("title", { required: true })} />
            {errors.title && <span className="text-destructive text-xs">Title is required</span>}
          </div>
          <div>
            <label className="block mb-1">Slug</label>
            <Input {...register("slug", { required: true })} />
            {errors.slug && <span className="text-destructive text-xs">Slug is required</span>}
          </div>
          <div>
            <label className="block mb-1">Menu</label>
            <Input {...register("menu")} />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`published-${pageId}`}
              {...register("published")}
              className="mr-2"
            />
            <label htmlFor={`published-${pageId}`}>Published</label>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>Update</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
