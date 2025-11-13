declare module "@/components/tracks/TrackCell" {
  import React from "react";
  const TrackCell: React.ComponentType<{ track: any }>;
  export default TrackCell;
}

declare module "@/stores/authStore" {
  const useAuthStore: any;
  export default useAuthStore;
}
