import React, { useEffect, useState } from "react";
import { get } from "@rails/request.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import PagesCreateDialog from "./PagesCreateDialog";
import { Link } from "react-router-dom";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import PagesEditTitleDialog from "./PagesEditTitleDialog";

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

  const fetchPages = React.useCallback(async () => {
    setLoading(true);
    const response = await get("/pages", { responseKind: "json" });
    if (response.ok) {
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
  }, [toast]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  return (
    <Card className="container mx-auto my-8">
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Pages</h2>
          <PagesCreateDialog onCreated={fetchPages} />
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Menu</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Edit</TableHead>
                  <TableHead>Edit Title</TableHead>
                  <TableHead>View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell>{page.id}</TableCell>
                    <TableCell>{page.title}</TableCell>
                    <TableCell>{page.slug}</TableCell>
                    <TableCell>{page.published ? "Yes" : "No"}</TableCell>
                    <TableCell>{page.menu}</TableCell>
                    <TableCell>{new Date(page.updated_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Link to={`/pages/${page.slug}/edit`}>
                        <Button size="sm" variant="outline">Edit</Button>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <PagesEditTitleDialog
                        pageId={page.id}
                        currentTitle={page.title}
                        currentSlug={page.slug}
                        currentPublished={page.published}
                        currentMenu={page.menu}
                        onUpdated={fetchPages}
                      />
                    </TableCell>
                    <TableCell>
                      <Link to={`/pages/${page.slug}`}>
                        <Button size="sm" variant="secondary">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {pages.length === 0 && (
              <div className="text-center text-muted-foreground py-4">No pages found.</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
