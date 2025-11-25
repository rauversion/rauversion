module PlaylistGen
  module Api
    module V1
      class LibraryUploadsController < ApplicationController
        def create
          library_upload = LibraryUpload.new(
            status: "pending",
            source: params[:source] || "rekordbox"
          )

          if params[:file].present?
            library_upload.file.attach(params[:file])
          end

          library_upload.save!

          # Run import inline (could be async with background job)
          Rekordbox::XmlImporter.call(library_upload)

          library_upload.reload

          render json: library_upload_json(library_upload), status: :created
        end

        def show
          library_upload = LibraryUpload.find(params[:id])
          render json: library_upload_json(library_upload, include_timestamps: true)
        end

        private

        def library_upload_json(upload, include_timestamps: false)
          json = {
            id: upload.id,
            status: upload.status,
            source: upload.source,
            total_tracks_imported: upload.total_tracks_imported,
            error_message: upload.error_message
          }

          if include_timestamps
            json[:created_at] = upload.created_at
            json[:updated_at] = upload.updated_at
          end

          json
        end
      end
    end
  end
end
