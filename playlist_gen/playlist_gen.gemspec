require_relative "lib/playlist_gen/version"

Gem::Specification.new do |spec|
  spec.name        = "playlist_gen"
  spec.version     = PlaylistGen::VERSION
  spec.authors     = ["Rauversion"]
  spec.email       = ["hello@rauversion.com"]
  spec.homepage    = "https://github.com/rauversion/rauversion"
  spec.summary     = "DJ Set Generator from Rekordbox library"
  spec.description = "Automatic DJ set generation system for Rekordbox XML libraries with AI-powered track search"
  spec.license     = "MIT"

  spec.files = Dir.chdir(File.expand_path(__dir__)) do
    Dir["{app,config,db,lib}/**/*", "MIT-LICENSE", "Rakefile", "README.md"]
  end

  spec.add_dependency "rails", ">= 8.0.0"
  spec.add_dependency "nokogiri"
  spec.add_dependency "neighbor"
end
