import React, { useEffect, useState } from "react";
import { get } from "@rails/request.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type Page = {
  id: number;
  title: string;
  slug: string;
  published: boolean;
  menu: string;
  body: any;
  settings: any;
  created_at: string;
  updated_at: string;
};


export default function PagesTable() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchPages() {
      setLoading(true);
      const response = await get("/pages", { responseKind: "json" });
      if (response.ok) {
        // @ts-ignore
        const result = await response.json
        setPages(result);
      } else {
        toast({
          title: "Error loading pages",
          description: "Could not fetch pages.",
          variant: "destructive",
        });
      }
      setLoading(false);
    }
    fetchPages();
  }, [toast]);

  return (
    <Card>
      <CardContent>
        <h2 className="text-xl font-bold mb-4">Pages</h2>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Title</th>
                  <th className="px-4 py-2 text-left">Slug</th>
                  <th className="px-4 py-2 text-left">Published</th>
                  <th className="px-4 py-2 text-left">Menu</th>
                  <th className="px-4 py-2 text-left">Updated</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr key={page.id} className="hover:bg-muted">
                    <td className="px-4 py-2">{page.id}</td>
                    <td className="px-4 py-2">{page.title}</td>
                    <td className="px-4 py-2">{page.slug}</td>
                    <td className="px-4 py-2">{page.published ? "Yes" : "No"}</td>
                    <td className="px-4 py-2">{page.menu}</td>
                    <td className="px-4 py-2">{new Date(page.updated_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pages.length === 0 && (
              <div className="text-center text-muted-foreground py-4">No pages found.</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
