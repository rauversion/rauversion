import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { InterestAlert } from "../shared/alerts";
import useAuthStore from "@/stores/authStore";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DirectUpload } from "@rails/activestorage";
import { post } from "@rails/request.js";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import Select from "react-select";
import { Category } from "@/lib/constants";
import { useThemeStore } from "@/stores/theme";
import { ImageUploader } from "@/components/ui/image-uploader";
import { Disc3, ListMusic, Mic2, Music, Radio, Share2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select as UiSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import selectTheme from "@/components/ui/selectTheme";
import I18n from "stores/locales";

import "@/styles/react-select.css";

const playlistTypeOptions = ["playlist", "album", "ep", "single", "compilation"];
const DEFAULT_MAX_FILE_SIZE_MB = 400;
const DJ_SET_MAX_FILE_SIZE_MB = 700;
const trackCategoryOptions = [
  {
    value: "music",
    icon: Music,
    titleKey: "tracks.new.categories.music.title",
    descriptionKey: "tracks.new.categories.music.description",
    detailKey: "tracks.new.categories.music.detail",
  },
  {
    value: "dj_set",
    icon: Disc3,
    titleKey: "tracks.new.categories.dj_set.title",
    descriptionKey: "tracks.new.categories.dj_set.description",
    detailKey: "tracks.new.categories.dj_set.detail",
  },
  {
    value: "podcast",
    icon: Mic2,
    titleKey: "tracks.new.categories.podcast.title",
    descriptionKey: "tracks.new.categories.podcast.description",
    detailKey: "tracks.new.categories.podcast.detail",
  },
];

export default function NewTrack() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDarkMode } = useThemeStore();
  const { currentUser } = useAuthStore();
  const [step, setStep] = React.useState("category"); // category, upload, info or share
  const [contentCategory, setContentCategory] = React.useState(null);
  const [rightsAcknowledged, setRightsAcknowledged] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [files, setFiles] = React.useState([]);
  const [uploadProgress, setUploadProgress] = React.useState({});
  const [uploadedFiles, setUploadedFiles] = React.useState([]);
  const [makePlaylist, setMakePlaylist] = React.useState(false);
  const [playlistTitle, setPlaylistTitle] = React.useState("");
  const [playlistType, setPlaylistType] = React.useState("playlist");
  const [playlistPrivacy, setPlaylistPrivacy] = React.useState("public");
  const [completedTracks, setCompletedTracks] = React.useState([]);
  const [completedPlaylist, setCompletedPlaylist] = React.useState(null);
  const fileInputRef = React.useRef(null);
  const progressContainerRef = React.useRef(null);
  const selectedCategoryOption = trackCategoryOptions.find(
    (option) => option.value === contentCategory
  );
  const selectedCategoryTitle = selectedCategoryOption
    ? I18n.t(selectedCategoryOption.titleKey)
    : "";
  const SelectedCategoryIcon = selectedCategoryOption?.icon || Music;
  const isDjSet = contentCategory === "dj_set";
  const maxFileSizeMb = isDjSet
    ? DJ_SET_MAX_FILE_SIZE_MB
    : DEFAULT_MAX_FILE_SIZE_MB;
  const maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;

  const titleFromFiles = (sourceFiles) =>
    sourceFiles[0]?.name.replace(/\.[^/.]+$/, "") || "";

  const handleMakePlaylistChange = (checked) => {
    setMakePlaylist(checked);
    if (checked && !playlistTitle.trim()) {
      setPlaylistTitle(titleFromFiles(files));
    }
  };

  const handleCategorySelect = (category) => {
    setContentCategory(category);
    if (category !== "dj_set") {
      setRightsAcknowledged(false);
    }
  };

  const handleCategoryContinue = () => {
    if (!contentCategory) return;
    if (isDjSet && !rightsAcknowledged) return;

    setStep("upload");
  };

  const renderPlaylistTypeSelect = (selectId) => (
    <div className="space-y-2">
      <Label htmlFor={selectId}>
        {I18n.t("tracks.new.controls.playlist_type")}
      </Label>
      <UiSelect value={playlistType} onValueChange={setPlaylistType}>
        <SelectTrigger id={selectId}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {playlistTypeOptions.map((type) => (
            <SelectItem key={type} value={type}>
              {I18n.t(`tracks.new.controls.playlist_types.${type}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </UiSelect>
    </div>
  );

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleFiles = (newFiles) => {
    const mediaFiles = newFiles.filter((file) =>
      file.type.startsWith("audio/") || file.type.startsWith("video/")
    );
    const acceptedFiles = mediaFiles.filter(
      (file) => file.size <= maxFileSizeBytes
    );
    if (mediaFiles.length !== newFiles.length) {
      toast({
        title: I18n.t("tracks.new.messages.invalid_files"),
        description: I18n.t("tracks.new.messages.media_only"),
        variant: "destructive",
      });
    }
    if (acceptedFiles.length !== mediaFiles.length) {
      toast({
        title: I18n.t("tracks.new.messages.invalid_files"),
        description: I18n.t("tracks.new.messages.file_too_large", {
          size: maxFileSizeMb,
        }),
        variant: "destructive",
      });
    }
    setFiles((prev) => [...prev, ...acceptedFiles]);
    if (makePlaylist && !playlistTitle.trim()) {
      setPlaylistTitle(titleFromFiles([...files, ...acceptedFiles]));
    }
  };

  const uploadFile = async (file, type = "audio") => {
    return new Promise((resolve, reject) => {
      const upload = new DirectUpload(
        file,
        "/rails/active_storage/direct_uploads",
        {
          directUploadWillStoreFileWithXHR: (request) => {
            request.upload.addEventListener("progress", (event) => {
              const progress = (event.loaded / event.total) * 100;
              if (type === "audio") {
                setUploadProgress((prev) => ({
                  ...prev,
                  [file.name]: progress,
                }));
              }
            });
          },
        }
      );

      upload.create((error, blob) => {
        if (error) {
          reject(error);
        } else {
          resolve(blob);
        }
      });
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      toast({
        title: I18n.t("tracks.new.messages.no_files"),
        description: I18n.t("tracks.new.messages.select_files"),
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Upload all files
      const uploadPromises = files.map((file) => uploadFile(file));
      const blobs = await Promise.all(uploadPromises);

      // Store uploaded files info
      setUploadedFiles(
        files.map((file, index) => ({
          name: file.name,
          blobId: blobs[index].signed_id,
          title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          description: "",
          tags: [],
          coverId: null,
          private: false,
          podcast: contentCategory === "podcast",
          dj_set: contentCategory === "dj_set",
        }))
      );

      setStep("info");
      toast({
        description: I18n.t("tracks.new.messages.upload_success", {
          count: files.length,
          plural: files.length > 1 ? "s" : "",
        }),
        variant: "success",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: I18n.t("tracks.new.messages.error_title"),
        description: I18n.t("tracks.new.messages.upload_error"),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const blob = await uploadFile(file, "image");
      updateTrackInfo(index, "coverId", blob.signed_id);
    } catch (error) {
      console.error("Cover upload error:", error);
      toast({
        title: I18n.t("tracks.new.messages.error_title"),
        description: I18n.t("tracks.new.messages.cover_error"),
        variant: "destructive",
      });
    }
  };

  const handleSubmitInfo = async (e) => {
    e.preventDefault();
    const shouldCreatePlaylist = makePlaylist && uploadedFiles.length > 1;

    if (shouldCreatePlaylist && !playlistTitle.trim()) {
      toast({
        title: I18n.t("tracks.new.messages.playlist_title_required"),
        description: I18n.t("tracks.new.messages.playlist_title_required_description"),
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await post("/tracks", {
        responseKind: "json",
        body: JSON.stringify({
          track_form: {
            step: "info",
            make_playlist: shouldCreatePlaylist,
            playlist_title: playlistTitle.trim(),
            playlist_type: playlistType,
            playlist_private: playlistPrivacy === "private",
            tracks_attributes: uploadedFiles.map((file) => ({
              audio: file.blobId,
              title: file.title,
              description: file.description,
              tags: file.tags,
              cover: file.coverId,
              private: file.private,
              podcast: file.podcast,
              dj_set: file.dj_set,
            })),
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json;

      if (data.success) {
        setCompletedTracks(data.tracks);
        setCompletedPlaylist(data.playlist || null);
        setStep("share");
      } else {
        toast({
          title: I18n.t("tracks.new.messages.error_title"),
          description: data.errors.join(", "),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: I18n.t("tracks.new.messages.error_title"),
        description: I18n.t("tracks.new.messages.save_error"),
        variant: "destructive",
      });
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[files[index].name];
      return newProgress;
    });
  };

  const updateTrackInfo = (index, field, value) => {
    setUploadedFiles((prev) =>
      prev.map((file, i) => (i === index ? { ...file, [field]: value } : file))
    );
  };

  if (step === "info") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form
          onSubmit={handleSubmitInfo}
          className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl space-y-4"
        >
          {selectedCategoryOption && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <SelectedCategoryIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <Label className="text-base font-medium">
                        {selectedCategoryTitle}
                      </Label>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {I18n.t(selectedCategoryOption.detailKey)}
                      </p>
                    </div>
                  </div>
                  {isDjSet && (
                    <Badge variant="secondary">
                      {I18n.t("tracks.dj_sets.badge")}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {makePlaylist && uploadedFiles.length > 1 && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <ListMusic className="h-5 w-5 text-muted-foreground" />
                  <Label className="text-base font-medium">
                    {I18n.t("tracks.new.controls.playlist_settings")}
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="playlist-title">
                    {I18n.t("tracks.new.controls.playlist_title")}
                  </Label>
                  <Input
                    id="playlist-title"
                    value={playlistTitle}
                    onChange={(event) => setPlaylistTitle(event.target.value)}
                    placeholder={I18n.t(
                      "tracks.new.controls.playlist_title_placeholder"
                    )}
                    required
                  />
                </div>

                {renderPlaylistTypeSelect("playlist-type")}

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {I18n.t("tracks.new.controls.playlist_privacy")}
                  </Label>
                  <RadioGroup
                    value={playlistPrivacy}
                    onValueChange={setPlaylistPrivacy}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="public" id="playlist-public-info" />
                      <Label htmlFor="playlist-public-info">
                        {I18n.t("tracks.new.controls.public")}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="private" id="playlist-private-info" />
                      <Label htmlFor="playlist-private-info">
                        {I18n.t("tracks.new.controls.private")}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          )}

          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="min-h-full flex justify-center py-6 sm:px-6 lg:px-8 border rounded-md"
            >
              <div className="flex gap-8 w-full max-w-4xl">
                {/* Left side - Cover Image */}
                <div className="w-48 flex flex-col gap-2">
                  <div className="aspect-square w-full bg-muted rounded-md overflow-hidden">
                    {file.coverId ? (
                      <img
                        src={`/rails/active_storage/blobs/redirect/${file.coverId}/cover.jpg`}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-background">
                        <Music className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <ImageUploader
                    aspectRatio={1}
                    imageUrl={
                      file.coverId
                        ? `/rails/active_storage/blobs/redirect/${file.coverId}/cover.jpg`
                        : null
                    }
                    onUploadComplete={(signedId) => {
                      updateTrackInfo(index, "coverId", signedId);
                    }}
                    preview={false}
                  />
                </div>

                {/* Right side - Form Fields */}
                <div className="flex-1 space-y-4">
                  <div>
                    <Label htmlFor={`title-${index}`}>
                      {I18n.t("tracks.new.form.title")}
                    </Label>
                    <Input
                      id={`title-${index}`}
                      value={file.title}
                      onChange={(e) =>
                        updateTrackInfo(index, "title", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor={`tags-${index}`}>
                      {I18n.t("tracks.new.form.tags")}
                    </Label>
                    <Select
                      id={`tags-${index}`}
                      value={file.tags.map((tag) => ({
                        value: tag,
                        label: tag,
                      }))}
                      theme={(theme) => selectTheme(theme, isDarkMode)}
                      onChange={(selected) =>
                        updateTrackInfo(
                          index,
                          "tags",
                          selected ? selected.map((option) => option.value) : []
                        )
                      }
                      options={Category.Genres.map((genre) => ({
                        value: genre,
                        label: genre,
                      }))}
                      isMulti
                      className="react-select-container"
                      classNamePrefix="react-select"
                      placeholder={I18n.t("tracks.new.form.tags_placeholder")}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`description-${index}`}>
                      {I18n.t("tracks.new.form.description")}
                    </Label>
                    <Textarea
                      id={`description-${index}`}
                      value={file.description}
                      onChange={(e) =>
                        updateTrackInfo(index, "description", e.target.value)
                      }
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`private-${index}`}
                      checked={file.private}
                      onCheckedChange={(checked) =>
                        updateTrackInfo(index, "private", checked)
                      }
                    />
                    <Label htmlFor={`private-${index}`}>
                      {I18n.t("tracks.new.form.private_track")}
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="mt-6">
            <Button type="submit" className="w-full">
              {I18n.t("tracks.new.form.save")}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  if (step === "share") {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {completedPlaylist && (
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 flex items-center justify-center bg-muted rounded-md">
                      <ListMusic className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {completedPlaylist.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-2">
                        <Link
                          to={`/playlists/${completedPlaylist.slug}`}
                          className="text-sm text-primary hover:text-primary/90"
                        >
                          {I18n.t("tracks.new.share.go_to_playlist")}
                        </Link>
                        {completedPlaylist.private && (
                          <Badge variant="secondary">
                            {I18n.t("tracks.new.controls.private")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/playlists/${completedPlaylist.slug}`
                      );
                      toast({
                        description: I18n.t("tracks.new.messages.link_copied"),
                      });
                    }}
                  >
                    {I18n.t("tracks.new.share.copy_playlist_link")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {completedTracks.map((track) => (
            <Card key={track.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex">
                  {/* Cover Image */}
                  <div className="mr-4">
                    <div className="relative w-32 h-32">
                      {track.cover_url ? (
                        <img
                          src={track.cover_url.medium}
                          alt={track.title}
                          className="w-full h-full object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted rounded-md">
                          <Music className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Track Info */}
                  <div className="flex-1">
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold">{track.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {track.user.username}
                      </p>
                    </div>

                    {track.private && (
                      <Badge variant="secondary" className="mb-2">
                        {I18n.t("tracks.private")}
                      </Badge>
                    )}
                    {track.dj_set && (
                      <Badge variant="secondary" className="mb-2 ml-2">
                        {I18n.t("tracks.dj_sets.badge")}
                      </Badge>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <p>{I18n.t("tracks.new.share.upload_complete")}</p>
                        <Link
                          to={`/tracks/${track.slug}`}
                          className="text-primary hover:text-primary/90"
                        >
                          {I18n.t("tracks.new.share.go_to_track")}
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Share Section */}
                  <div className="pl-4 w-56 border-l">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Share2 className="h-4 w-4" />
                          {I18n.t("tracks.new.share.share")}
                        </h4>

                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            className="w-full justify-start text-sm"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${window.location.origin}/tracks/${track.slug}`
                              );
                              toast({
                                description: I18n.t(
                                  "tracks.new.messages.link_copied"
                                ),
                              });
                            }}
                          >
                            {I18n.t("tracks.new.share.copy_link")}
                          </Button>

                          <Button
                            variant="outline"
                            className="w-full justify-start text-sm"
                            asChild
                          >
                            <a
                              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                                `${window.location.origin}/tracks/${track.id}`
                              )}&text=${encodeURIComponent(track.title)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {I18n.t("tracks.new.share.share_twitter")}
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const handleArtistInterest = async () => {
    toast({
      title: I18n.t("tracks.new.messages.success_title"),
      description: I18n.t("tracks.new.messages.artist_interest_submitted"),
    });
  };

  if (currentUser && !currentUser?.is_creator) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <InterestAlert type="artist" onSubmit={handleArtistInterest} />
      </div>
    );
  }

  if (step === "category") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="mb-4">
            {I18n.t("tracks.new.category_step.badge")}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {I18n.t("tracks.new.category_step.title")}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {I18n.t("tracks.new.category_step.subtitle")}
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {trackCategoryOptions.map((option) => {
            const Icon = option.icon;
            const selected = contentCategory === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleCategorySelect(option.value)}
                className={`rounded-lg border p-5 text-left transition ${
                  selected
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-background text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  {selected && (
                    <Badge variant="secondary">
                      {I18n.t("tracks.new.category_step.selected")}
                    </Badge>
                  )}
                </div>
                <h2 className="mt-5 text-lg font-semibold text-foreground">
                  {I18n.t(option.titleKey)}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {I18n.t(option.descriptionKey)}
                </p>
              </button>
            );
          })}
        </div>

        {isDjSet && (
          <Card className="mt-6 border-amber-500/40 bg-amber-500/10">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <Radio className="mt-1 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <h3 className="font-semibold text-foreground">
                    {I18n.t("tracks.new.dj_set_notice.title")}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {I18n.t("tracks.new.dj_set_notice.body")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {I18n.t("tracks.new.dj_set_notice.removal")}
                  </p>
                </div>
              </div>
              <label className="flex items-start gap-3 rounded-md border border-amber-500/30 bg-background/70 p-3">
                <Checkbox
                  checked={rightsAcknowledged}
                  onCheckedChange={(checked) => setRightsAcknowledged(Boolean(checked))}
                />
                <span className="text-sm leading-5 text-foreground">
                  {I18n.t("tracks.new.dj_set_notice.acknowledgement")}
                </span>
              </label>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 flex justify-center">
          <Button
            type="button"
            size="lg"
            disabled={!contentCategory || (isDjSet && !rightsAcknowledged)}
            onClick={handleCategoryContinue}
          >
            <SelectedCategoryIcon className="mr-2 h-4 w-4" />
            {I18n.t("tracks.new.category_step.continue")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="uploader flex justify-center my-10">
        <div className="flex-col max-w-2xl w-full">
          <div className="text-center">
            {selectedCategoryOption && (
              <div className="mb-4 flex items-center justify-center gap-2">
                <Badge variant="secondary">{selectedCategoryTitle}</Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("category")}
                >
                  {I18n.t("tracks.new.upload.change_category")}
                </Button>
              </div>
            )}
            <h3 className="text-2xl font-semibold text-default">
              {I18n.t(`tracks.new.upload.title_by_category.${contentCategory || "music"}`)}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {I18n.t(`tracks.new.upload.subtitle_by_category.${contentCategory || "music"}`)}
            </p>
          </div>

          <div
            onDragEnter={(e) => e.preventDefault()}
            onDragLeave={(e) => e.preventDefault()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="mt-8 flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg border-muted hover:border-muted-foreground transition-colors cursor-pointer"
          >
            <Music className="h-12 w-12 text-muted-foreground mb-4" />

            <Label
              htmlFor="audio-upload"
              className="text-sm font-medium text-primary hover:text-primary/80 cursor-pointer"
            >
              {I18n.t("tracks.new.upload.button")}
            </Label>
            <p className="mt-1 text-sm text-muted-foreground">
              {I18n.t("tracks.new.upload.or_drop")}
            </p>

            <input
              id="audio-upload"
              type="file"
              multiple
              accept="audio/*,video/*"
              onChange={handleFileSelect}
              ref={fileInputRef}
              className="hidden"
            />

            <p className="mt-2 text-xs text-muted-foreground">
              {I18n.t("tracks.new.upload.size_limit", {
                size: maxFileSizeMb,
              })}
            </p>
          </div>

          {isDjSet && (
            <Card className="mt-6 border-amber-500/40 bg-amber-500/10">
              <CardContent className="p-4 text-sm leading-6 text-muted-foreground">
                {I18n.t("tracks.new.dj_set_notice.body")}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-8 max-w-3xl mx-auto space-y-4">
          {files.map((file, index) => (
            <Card key={file.name} className="relative">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center bg-muted rounded-md">
                    <Music className="h-6 w-6 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium truncate">
                          {file.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setFiles(files.filter((_, i) => i !== index));
                          setUploadProgress((prev) => {
                            const newProgress = { ...prev };
                            delete newProgress[file.name];
                            return newProgress;
                          });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-2 space-y-1">
                      <Progress
                        value={uploadProgress[file.name] || 0}
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {uploadProgress[file.name]
                            ? `${Math.round(uploadProgress[file.name])}%`
                            : I18n.t("tracks.new.controls.waiting")}
                        </span>
                        {uploadProgress[file.name] === 100 && (
                          <span className="text-primary">
                            {I18n.t("tracks.new.controls.complete")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Playlist Controls */}
          {files.length > 1 && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="make-playlist"
                    checked={makePlaylist}
                    onCheckedChange={handleMakePlaylistChange}
                  />
                  <Label htmlFor="make-playlist">
                    {I18n.t("tracks.new.controls.create_playlist")}
                  </Label>
                </div>

                {makePlaylist && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="playlist-title-upload">
                        {I18n.t("tracks.new.controls.playlist_title")}
                      </Label>
                      <Input
                        id="playlist-title-upload"
                        value={playlistTitle}
                        onChange={(event) => setPlaylistTitle(event.target.value)}
                        placeholder={I18n.t(
                          "tracks.new.controls.playlist_title_placeholder"
                        )}
                      />
                    </div>

                    {renderPlaylistTypeSelect("playlist-type-upload")}

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {I18n.t("tracks.new.controls.playlist_privacy")}
                      </Label>
                      <RadioGroup
                        value={playlistPrivacy}
                        onValueChange={setPlaylistPrivacy}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="public" id="playlist-public" />
                          <Label htmlFor="playlist-public">
                            {I18n.t("tracks.new.controls.public")}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="private" id="playlist-private" />
                          <Label htmlFor="playlist-private">
                            {I18n.t("tracks.new.controls.private")}
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setFiles([]);
                setUploadProgress({});
                setMakePlaylist(false);
                setPlaylistTitle("");
                setPlaylistType("playlist");
              }}
            >
              {I18n.t("tracks.new.controls.clear_all")}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
            >
              {uploading
                ? I18n.t("tracks.new.controls.uploading")
                : I18n.t("tracks.new.controls.start_upload")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
