import React from "react";
import { useParams } from "react-router-dom";
import { get, put } from "@rails/request.js";
import { useToast } from "@/hooks/use-toast";
import { PuckEditor } from "../puck";

function Editor({ pageId }) {
  const [data, setData] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  

  // Save the data to your database
  async function save(newData) {
    try {
      const response = await put(`/pages/${pageId}.json`, {
        body: JSON.stringify({
          page: {
            body: newData
          }
        }),
        responseKind: "json",
      });

      if (!response.ok) {
        throw new Error('Failed to save page data');
      }

      const result = await response.json;
      toast({
        description: "Page updated successfully",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not update page",
        variant: "destructive",
      });
    }
  }

  React.useEffect(() => {
    const fetchEditorData = async () => {
      try {
        if (!pageId) {
          setLoading(false);
          return;
        }

        const response = await get(`/pages/${pageId}.json`);
        if (response.ok) {
          const pageData = await response.json;
          if (pageData.body) {
            setData(pageData.body);
          }
        }
      } catch (error) {
        // Optionally handle error
      } finally {
        setLoading(false);
      }
    };

    fetchEditorData();
  }, [pageId]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="text-lg text-gray-600">Loading editor...</div>
    </div>;
  }

  return (
    <PuckEditor data={data} onPublish={save} />
  );
}

export default function PagesEditor() {
  const { id } = useParams();
  const { toast } = useToast();
  const [page, setPage] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchPage = async () => {
      try {
        const response = await get(`/pages/${id}.json`);
        if (response.ok) {
          const data = await response.json;
          setPage(data);
        } else {
          toast({
            title: "Error",
            description: "Could not load page",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not load page",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [id, toast]);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!page) return null;

  return (
    <div className="h-screen">
      <Editor pageId={id} />
    </div>
  );
}
