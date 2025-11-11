import React from "react"
import { useParams } from "react-router-dom"
import { get, put } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"

import { PuckEditor } from "../puck"

// Render Puck editor
function Editor({ releaseId }) {
  // Describe the initial data
  const initialData = {};
  const [data, setData] = React.useState(initialData);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  // Save the data to your database
  async function save(data) {
    console.log("Saving data: ", data);

    try {
      const response = await put(`/releases/${releaseId}.json`, {
        body: JSON.stringify({
          release: {
            editor_data: data
          }
        }),
        responseKind: "json",
      });

      if (!response.ok) {
        throw new Error('Failed to save release data');
      }

      const result = await response.json;
      console.log("Save successful:", result);
      toast({
        description: "Release updated successfully",
        variant: "success",
      });
    } catch (error) {
      console.error("Error saving release data:", error);
      toast({
        title: "Error",
        description: "Could not update release",
        variant: "destructive",
      });
    }
  }

  React.useEffect(() => {
    const fetchEditorData = async () => {
      try {
        if (!releaseId) {
          console.error('No release ID found');
          setLoading(false);
          return;
        }

        const response = await get(`/releases/${releaseId}.json`);
        if (response.ok) {
          const releaseData = await response.json;
          if (releaseData.editor_data) {
            setData(releaseData.editor_data);
          }
        }
      } catch (error) {
        console.error('Error loading editor data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEditorData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="text-lg text-muted-foreground">Loading editor...</div>
    </div>;
  }

  return (
    <PuckEditor data={data} onPublish={save} />
  );
}

export default function ReleaseEditor() {
  const { id } = useParams()
  const { toast } = useToast()
  const [release, setRelease] = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchRelease = async () => {
      try {
        const response = await get(`/releases/${id}/editor.json`)
        if (response.ok) {
          const data = await response.json
          setRelease(data)
        } else {
          toast({
            title: "Error",
            description: "Could not load release",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching release:", error)
        toast({
          title: "Error",
          description: "Could not load release",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchRelease()
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!release) return null

  /*if (release.editor_data && release.editor_data.theme_schema) {
    return (
      <div className="h-screen">
        <PageBuilder releaseId={id} defaultBlocks={release.editor_data.theme_schema} />
      </div>
    )
  }*/

  return (
    <div className="h-screen">
      <Editor releaseId={id} />
    </div>
  )
}
