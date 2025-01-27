import React from 'react';

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

export default ImageUploadField;
