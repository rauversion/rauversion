module PlaylistGen
  class XmlImportJob < ApplicationJob
    queue_as :default

    def perform(library_upload_id)
      library_upload = LibraryUpload.find(library_upload_id)
      Rekordbox::XmlImporter.call(library_upload)
    end
  end
end
