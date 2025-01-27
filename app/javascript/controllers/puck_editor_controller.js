import { Controller } from '@hotwired/stimulus';
import React from 'react'
import { createRoot } from 'react-dom/client';
import { Puck, DropZone } from "@measured/puck";
import "@measured/puck/puck.css";
import PlaylistComponent from '../components/playlist';

// Custom Image Upload Field Component
const ImageUploadField = ({ onChange, value }) => {
  const [uploading, setUploading] = React.useState(false);
  const [preview, setPreview] = React.useState(value);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/playlists/1/releases/upload_puck_image', {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content,
        },
      });

      const data = await response.json();
      setPreview(data.url);
      onChange(data.url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {preview && (
        <div className="relative w-full h-32">
          <img src={preview} alt="Preview" className="w-full h-full object-cover rounded" />
        </div>
      )}
      <div className="flex items-center gap-2">
        <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          {uploading ? 'Uploading...' : 'Choose Image'}
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
        {value && (
          <button
            onClick={() => {
              setPreview(null);
              onChange('');
            }}
            className="text-red-500 hover:text-red-600"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
};

const ColorPicker = ({ onChange, value, label }) => {
  return (
    <div>
      <label>{label}:</label>
      <input type="color" value={value} onChange={onChange} />
    </div>
  );
}

// Create Puck component config
const config = {
  components: {
    MultiList: {
      fields: {
        columns: {
          type: "array",
          label: "List Columns",
          arrayFields: {
            title: {
              type: "text",
              label: "Column Title",
            },
            items: {
              type: "array",
              label: "List Items",
              arrayFields: {
                text: {
                  type: "text",
                  label: "Item Text"
                }
              }
            }
          }
        },
        gridCols: {
          type: "select",
          label: "Number of Columns",
          options: [
            { label: "2 Columns", value: "grid-cols-2" },
            { label: "3 Columns", value: "grid-cols-3" },
            { label: "4 Columns", value: "grid-cols-4" },
          ],
          defaultValue: "grid-cols-2"
        },
        textColor: {
          type: "text",
          label: "Text Color",
          defaultValue: "text-white/80"
        },
        textSize: {
          type: "select",
          label: "Text Size",
          options: [
            { label: "Extra Small", value: "text-xs" },
            { label: "Small", value: "text-sm" },
            { label: "Base", value: "text-base" },
            { label: "Large", value: "text-lg" },
          ],
          defaultValue: "text-xs"
        }
      },
      defaultProps: {
        columns: [
          {
            title: "RECENT SHOWS",
            items: [
              { text: "2025 | Aniversario 30 años Perrera Arte" },
              { text: "2024 | Creamfields, Chile" },
              { text: "2024 | M100: Festival Le Rock" },
              { text: "2023 | Creamfields, Chile" },
              { text: "2023 | Micro Mutek, Chile" }
            ]
          },
          {
            title: "CONTACT",
            items: [
              { text: "contacto@reneroco.info" },
              { text: "contacto@tensarecords.com" },
              { text: "reneroco.info" },
              { text: "@renerocovmv" },
              { text: "tensarecords.com" }
            ]
          }
        ],
        gridCols: "grid-cols-2",
        textColor: "text-white/80",
        textSize: "text-xs"
      },
      render: ({ columns, gridCols, textColor, textSize }) => {
        return (
          <div className={`grid ${gridCols} gap-4 ${textColor} ${textSize}`}>
            {columns.map((column, index) => (
              <div key={index}>
                <h3 className="font-bold mb-2">{column.title}</h3>
                <ul className="space-y-1">
                  {column.items.map((item, itemIndex) => (
                    <li key={itemIndex}>{item.text}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        );
      },
    },
    Example: {
      render: () => {
        return (
          <div>
            <DropZone zone="my-content" />
          </div>
        );
      },
    },
    Playlist: {
      fields: {
        playlistId: {
          type: "text",
          label: "Playlist ID",
          defaultValue: "",
        },
        theme: {
          type: "select",
          label: "Theme",
          options: [
            { label: "Dark", value: "dark" },
            { label: "Light", value: "light" }
          ],
          defaultValue: "dark",
        },
      },
      render: ({ playlistId, theme }) => {
        return (
          <div className={`${theme === 'dark' ? 'bg-zinc-900' : 'bg-white'} rounded-lg p-6`}>
            <PlaylistComponent playlistId={playlistId} />
          </div>
        );
      },
    },
    HeroSection: {
      fields: {
        backgroundImage: {
          type: "custom",
          label: "Background Image",
          render: ({ field, value, onChange }) => (
            <ImageUploadField value={value} onChange={onChange} />
          ),
        },
        overlayColor: {
          type: "text",
          label: "Overlay Color",
          defaultValue: "rgba(0,0,0,0.5)",
        },
        height: {
          type: "text",
          label: "Height",
          defaultValue: "500px",
        }
      },
      render: ({ backgroundImage, overlayColor, height }) => {
        return (
          <div 
            style={{ 
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              height,
              position: 'relative',
            }}
          >
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: overlayColor,
              }}
            />
          </div>
        );
      },
    },
    Title: {
      fields: {
        text: {
          type: "text",
          label: "Title Text",
        },
        size: {
          type: "select",
          label: "Size",
          options: [
            { label: "XXLarge", value: "text-9xl" },
            { label: "XLarge", value: "text-6xl" },
            { label: "Large", value: "text-4xl" },
            { label: "Medium", value: "text-2xl" },
            { label: "Small", value: "text-xl" },
          ]
        },
        alignment: {
          type: "select",
          label: "Alignment",
          options: [
            { label: "Left", value: "text-left" },
            { label: "Center", value: "text-center" },
            { label: "Right", value: "text-right" },
          ]
        },
      },
      defaultProps: { text: "Hello, world", size: "text-2xl", alignment: "text-center" },
      render: ({ text, size, alignment }) => {
        return <h1 className={`font-bold ${size} ${alignment} mb-4`}>{text}</h1>;
      },
    },
    Subtitle: {
      fields: {
        text: {
          type: "text",
          label: "Subtitle Text",
        },
        color: {
          type: "text",
          label: "Text Color",
          defaultValue: "#666666",
        },
      },
      render: ({ text, color }) => {
        return <h2 className="text-xl mb-6" style={{ color }}>{text}</h2>;
      },
    },
    Carousel: {
      fields: {
        items: {
          type: "array",
          label: "Slides",
          arrayFields: {
            image: {
              type: "text",
              label: "Image URL",
            },
            caption: {
              type: "text",
              label: "Caption",
            },
          },
        },
        autoplay: {
          type: "select",
          label: "Enable Autoplay",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false }
          ],
          defaultValue: true,
        },
        interval: {
          type: "text",
          label: "Interval (ms)",
          defaultValue: "5000",
        },
      },
      render: ({ items = [], autoplay, interval }) => {
        const [currentSlide, setCurrentSlide] = React.useState(0);

        React.useEffect(() => {
          if (autoplay) {
            const timer = setInterval(() => {
              setCurrentSlide((prev) => (prev + 1) % items.length);
            }, parseInt(interval, 10));
            return () => clearInterval(timer);
          }
        }, [autoplay, interval, items.length]);

        return (
          <div className="relative overflow-hidden">
            <div className="flex transition-transform duration-500" style={{
              transform: `translateX(-${currentSlide * 100}%)`,
            }}>
              {items.map((item, index) => (
                <div key={index} className="w-full flex-shrink-0">
                  <img src={item.image} alt={item.caption} className="w-full h-64 object-cover" />
                  {item.caption && (
                    <div className="p-4 text-center bg-black bg-opacity-50 text-white">
                      {item.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {items.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    currentSlide === index ? 'bg-white' : 'bg-white/50'
                  }`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </div>
        );
      },
    },
    HeadingBlock: {
      fields: {
        children: {
          type: "text",
        },
      },
      render: ({ children }) => {
        return <h1>{children}</h1>;
      },
    },
  },
  root: {
    fields: {
      background: {
        type: "custom",
        label: "Background Color",
        defaultValue: "#ffffff",
        render: ({ field, value, onChange }) => (
          <ColorPicker value={value} onChange={onChange} label="Background Color" />
        ),
      },
      textColor: {
        type: "custom",
        label: "Text Color",
        defaultValue: "#000000",
        render: ({ field, value, onChange }) => (
          <ColorPicker value={value} onChange={onChange} label="Text Color" />
        ),
      },
      alignment: {
        type: "select",
        label: "Alignment",
        options: [
          { label: "Left", value: "text-left" },
          { label: "Center", value: "text-center" },
          { label: "Right", value: "text-right" },
        ]
      }
    },
    render: ({ children }) => {
      return <div className="py-10">{children}</div>;
    },
  },
};
 
// Describe the initial data
const initialData = {};
 
// Save the data to your database
const save = (data) => {
  console.log('Saving data:', data);
};
 
// Render Puck editor
function Editor() {
  return <Puck config={config} 
  data={initialData} 
  onPublish={save} />;
}

export default class extends Controller {
  static targets = []

  initialize(){
    const wrapper = this.element;
    const root = createRoot(wrapper);
    root.render(<Editor />);
  }

  disconnect(){
    
  }
}