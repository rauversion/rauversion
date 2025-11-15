import React, { useEffect, useRef, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import styled from "@emotion/styled";
import axios from "axios";
// import { image } from "../icons";
import { Image } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
export const StyleWrapper = styled(NodeViewWrapper)``;

// NodeView component used inside the editor
export default function ScrollGalleryBlock(props: any) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [scale1, setScale1] = useState(2);
  const [scale2, setScale2] = useState(2);
  const fileInput1Ref = useRef<HTMLInputElement | null>(null);
  const fileInput2Ref = useRef<HTMLInputElement | null>(null);

  const { url1, url2, loading1, loading2 } = props.node.attrs;

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const wrapper1 = sectionRef.current.querySelector(
        ".image-wrapper-1"
      ) as HTMLElement | null;
      const wrapper2 = sectionRef.current.querySelector(
        ".image-wrapper-2"
      ) as HTMLElement | null;

      if (wrapper1) {
        const rect1 = wrapper1.getBoundingClientRect();
        const scrollProgress1 = Math.max(
          0,
          Math.min(1, -rect1.top / (rect1.height - window.innerHeight))
        );
        const newScale1 = 2 - scrollProgress1;
        setScale1(newScale1);
      }

      if (wrapper2) {
        const rect2 = wrapper2.getBoundingClientRect();
        const scrollProgress2 = Math.max(
          0,
          Math.min(1, -rect2.top / (rect2.height - window.innerHeight))
        );
        const newScale2 = 2 - scrollProgress2;
        setScale2(newScale2);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function startLoader1() {
    props.updateAttributes({ loading1: true });
  }

  function stopLoader1() {
    props.updateAttributes({ loading1: false });
  }

  function startLoader2() {
    props.updateAttributes({ loading2: true });
  }

  function stopLoader2() {
    props.updateAttributes({ loading2: false });
  }

  function setImage1(url: string) {
    props.updateAttributes({ url1: url });
  }

  function setImage2(url: string) {
    props.updateAttributes({ url2: url });
  }

  function formatData(file: File) {
    const formData = new FormData();
    const formName = props.extension.options.upload_formName || "file";
    formData.append(formName, file);
    return formData;
  }

  function getUploadUrl() {
    const url = props.extension.options.upload_url;
    if (typeof url === "function") {
      return url();
    }
    return url;
  }

  function getUploadHeaders() {
    return props.extension.options.upload_headers || {};
  }

  function uploadFile(
    file: File,
    { onStart, onComplete, onError }: {
      onStart: () => void;
      onComplete: (url: string) => void;
      onError: (error: any) => void;
    }
  ) {
    if (!file) return;

    // custom upload handler
    if (props.extension.options.upload_handler) {
      onStart();
      return props.extension.options.upload_handler(file, props);
    }

    if (!props.extension.options.upload_url) {
      return;
    }

    onStart();

    axios({
      method: "post",
      url: getUploadUrl(),
      headers: getUploadHeaders(),
      data: formatData(file),
    })
      .then((result) => {
        const uploadedUrl = result.data.url;
        onComplete(uploadedUrl);
        if (props.extension.options.upload_callback) {
          return props.extension.options.upload_callback(result, props);
        }
      })
      .catch((error) => {
        console.log(`ERROR: got error uploading file ${error}`);
        onError(error);
        if (props.extension.options.upload_error_callback) {
          return props.extension.options.upload_error_callback(error, props);
        }
      });
  }

  function handleFileInput1(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    props.updateAttributes({ url1: localUrl });

    uploadFile(file, {
      onStart: startLoader1,
      onComplete: (uploadedUrl) => {
        setImage1(uploadedUrl);
        stopLoader1();
      },
      onError: () => {
        stopLoader1();
      },
    });
  }

  function handleFileInput2(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    props.updateAttributes({ url2: localUrl });

    uploadFile(file, {
      onStart: startLoader2,
      onComplete: (uploadedUrl) => {
        setImage2(uploadedUrl);
        stopLoader2();
      },
      onError: () => {
        stopLoader2();
      },
    });
  }

  function setActive() {
    props.editor.commands.setNodeSelection(props.getPos());
  }

  function handleClick() {
    setActive();
  }

  return (
    <StyleWrapper
      selected={props.selected}
      as="figure"
      data-drag-handle="true"
      className={`graf graf--figure scroll-gallery-block ${
        props.selected ? "is-selected is-mediaFocused" : ""
      }`}
    >
      {props.editor.isEditable && (
        <div className="scroll-gallery-controls mb-4 flex justify-end">
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-200 shadow-sm transition hover:border-pink-500/70 hover:bg-zinc-900/90"
              >
                <Image className="h-3.5 w-3.5" />
                <span>Editar imágenes</span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-xl border-zinc-800 bg-zinc-950/95">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-sm">
                  <Image className="h-4 w-4" />
                  <span>Scroll gallery</span>
                </DialogTitle>
              </DialogHeader>
              <div className="mt-3 space-y-4">
                <p className="text-xs text-zinc-400">
                  Sube las imágenes superior e inferior para este bloque.
                </p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {/* Top image uploader */}
                  <button
                    type="button"
                    onClick={() => fileInput1Ref.current?.click()}
                    className="group relative flex w-full items-center justify-between rounded-xl border border-dashed border-zinc-700/80 bg-zinc-900/40 px-4 py-3 text-left shadow-sm transition hover:border-pink-500/70 hover:bg-zinc-900/80"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200 ring-1 ring-zinc-700/70 group-hover:bg-pink-600 group-hover:text-white group-hover:ring-pink-500/70">
                        <Image className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-zinc-100">
                          Imagen superior
                        </span>
                        <span className="text-xs text-zinc-400">
                          Haz clic para seleccionar una imagen
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {url1 && (
                        <span className="inline-flex h-6 items-center rounded-full bg-zinc-800 px-2 text-[10px] font-medium uppercase tracking-wide text-zinc-300">
                          Seleccionada
                        </span>
                      )}
                      {loading1 && (
                        <span className="text-xs text-zinc-400">
                          Subiendo…
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Bottom image uploader */}
                  <button
                    type="button"
                    onClick={() => fileInput2Ref.current?.click()}
                    className="group relative flex w-full items-center justify-between rounded-xl border border-dashed border-zinc-700/80 bg-zinc-900/40 px-4 py-3 text-left shadow-sm transition hover:border-pink-500/70 hover:bg-zinc-900/80"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200 ring-1 ring-zinc-700/70 group-hover:bg-pink-600 group-hover:text-white group-hover:ring-pink-500/70">
                        <Image className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-zinc-100">
                          Imagen inferior
                        </span>
                        <span className="text-xs text-zinc-400">
                          Haz clic para seleccionar una imagen
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {url2 && (
                        <span className="inline-flex h-6 items-center rounded-full bg-zinc-800 px-2 text-[10px] font-medium uppercase tracking-wide text-zinc-300">
                          Seleccionada
                        </span>
                      )}
                      {loading2 && (
                        <span className="text-xs text-zinc-400">
                          Subiendo…
                        </span>
                      )}
                    </div>
                  </button>
                </div>

                {/* Hidden native inputs */}
                <input
                  ref={fileInput1Ref}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput1}
                  className="hidden"
                />
                <input
                  ref={fileInput2Ref}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput2}
                  className="hidden"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div onClick={handleClick}>
        <section ref={sectionRef} className="relative w-full">
          {/* First Image - top */}
          <div
            className="image-wrapper-1 absolute"
            style={{ height: "400vh", top: 0, left: 0, width: "100%" }}
          >
            <div className="sticky top-0 w-screen h-screen overflow-hidden">
              <div
                className="w-full h-full bg-cover bg-center bg-no-repeat will-change-transform"
                style={{
                  backgroundImage: url1 ? `url('${url1}')` : "none",
                  backgroundColor: url1 ? "transparent" : "#f0f0f0",
                  transformOrigin: "center center",
                  transform: `scale(${scale1})`,
                }}
              />
            </div>
          </div>

          {/* Second Image - middle */}
          <div
            className="image-wrapper-2 absolute"
            style={{
              height: "200vh",
              top: "200vh",
              left: 0,
              width: "100%",
              zIndex: 2,
            }}
          >
            <div className="sticky top-0 w-screen h-screen overflow-hidden">
              <div
                className="w-full h-full bg-cover bg-center bg-no-repeat will-change-transform"
                style={{
                  backgroundImage: url2 ? `url('${url2}')` : "none",
                  backgroundColor: url2 ? "transparent" : "#e0e0e0",
                  transformOrigin: "center center",
                  transform: `scale(${scale2})`,
                }}
              />
            </div>
          </div>

          {/* Spacer to enable scroll */}
          <div style={{ height: "400vh" }} />
        </section>
      </div>
    </StyleWrapper>
  );
}

export const ScrollGalleryBlockConfig = (options = {}) => {
  const config = {
    name: "ScrollGalleryBlock",
    icon: () => <Image />,
    tag: "scroll-gallery-block",
    component: ScrollGalleryBlock,
    atom: false,
    draggable: true,
    attributes: {
      class: "self-start",
      url1: { default: null },
      url2: { default: null },
      loading1: { default: false },
      loading2: { default: false },
    },
    widget_options: {
      displayOnInlineTooltip: true,
      insertion: "insertion",
      insert_block: "ScrollGalleryBlock",
    },
    options: {
      upload_handler: (file: any, ctx: any) => {
        console.log("UPLOADED FILE (scroll gallery)", file, ctx);
      },
    },
  };

  return Object.assign(config, options);
};

// Renderer for read-only usage (outside the editor)
export function ScrollGalleryRenderer({
  blockKey,
  data,
}: {
  blockKey: any;
  data: any;
}) {
  const [scale1, setScale1] = useState(2);
  const [scale2, setScale2] = useState(2);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  const { url1, url2 } = data;

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const wrapper1 = sectionRef.current.querySelector(
        ".image-wrapper-1"
      ) as HTMLElement | null;
      const wrapper2 = sectionRef.current.querySelector(
        ".image-wrapper-2"
      ) as HTMLElement | null;

      if (wrapper1) {
        const rect1 = wrapper1.getBoundingClientRect();
        const scrollProgress1 = Math.max(
          0,
          Math.min(1, -rect1.top / (rect1.height - window.innerHeight))
        );
        const newScale1 = 2 - scrollProgress1;
        setScale1(newScale1);
      }

      if (wrapper2) {
        const rect2 = wrapper2.getBoundingClientRect();
        const scrollProgress2 = Math.max(
          0,
          Math.min(1, -rect2.top / (rect2.height - window.innerHeight))
        );
        const newScale2 = 2 - scrollProgress2;
        setScale2(newScale2);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <figure
      key={blockKey}
      className="scroll-gallery-block-renderer"
    >
      <section ref={sectionRef} className="relative w-full">
        <div
          className="image-wrapper-1 absolute"
          style={{ height: "400vh", top: 0, left: 0, width: "100%" }}
        >
          <div className="sticky top-0 w-screen h-screen overflow-hidden">
            <div
              className="w-full h-full bg-cover bg-center bg-no-repeat will-change-transform"
              style={{
                backgroundImage: url1 ? `url('${url1}')` : "none",
                backgroundColor: url1 ? "transparent" : "#f0f0f0",
                transformOrigin: "center center",
                transform: `scale(${scale1})`,
              }}
            />
          </div>
        </div>

        <div
          className="image-wrapper-2 absolute"
          style={{
            height: "200vh",
            top: "200vh",
            left: 0,
            width: "100%",
            zIndex: 2,
          }}
        >
          <div className="sticky top-0 w-screen h-screen overflow-hidden">
            <div
              className="w-full h-full bg-cover bg-center bg-no-repeat will-change-transform"
              style={{
                backgroundImage: url2 ? `url('${url2}')` : "none",
                backgroundColor: url2 ? "transparent" : "#e0e0e0",
                transformOrigin: "center center",
                transform: `scale(${scale2})`,
              }}
            />
          </div>
        </div>

        <div style={{ height: "400vh" }} />
      </section>
    </figure>
  );
}
