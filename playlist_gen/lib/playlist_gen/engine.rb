module PlaylistGen
  class Engine < ::Rails::Engine
    isolate_namespace PlaylistGen

    config.generators do |g|
      g.test_framework :rspec
    end
  end
end
