import React from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { post } from "@rails/request.js";

type CreatePageForm = {
  title: string;
  slug: string;
  published: boolean;
  menu: string;
};

export default function PagesCreateDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreatePageForm>({
    defaultValues: {
      title: "",
      slug: "",
      published: false,
      menu: ""
    }
  });

  const onSubmit = async (data: CreatePageForm) => {
  
    const response = await post("/pages", {
      body: {
        page: {
          title: data.title,
          slug: data.slug,
          published: data.published,
          menu: data.menu,
        }
      },
      responseKind: "json"
    });


    if (response.ok) {
      toast({ title: "Page created" });
      setOpen(false);
      reset();
      onCreated && onCreated();
    } else {
      // @ts-ignore
      const errors = response.json?.errors || ["Unknown error"];
      toast({
        title: "Error creating page",
        description: Array.isArray(errors) ? errors.join(", ") : String(errors),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">New Page</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Page</DialogTitle>
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
          <div className="flex items-center space-x-2">
            <Checkbox id="published" {...register("published")} />
            <label htmlFor="published">Published</label>
          </div>
          <div>
            <label className="block mb-1">Menu</label>
            <Input {...register("menu")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
