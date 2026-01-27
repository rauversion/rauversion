# Theme seeds
# Create some system themes with deploy_options pointing to GitHub repositories

themes = [
  {
    name: 'Pullentity Portfolio Theme',
    system_theme: true,
    description: 'A modern portfolio theme for artists and creators',
    deploy_options: {
      repo: 'michelson/pullentity-portfolio-theme',
      ref: 'main',
      env: 'production'
    }
  },
  {
    name: 'Music Player Theme',
    system_theme: true,
    description: 'A sleek music player focused theme',
    deploy_options: {
      repo: 'rauversion/music-player-theme',
      ref: 'main',
      env: 'production'
    }
  },
  {
    name: 'Minimal Artist Theme',
    system_theme: true,
    description: 'A minimal, clean theme for artists',
    deploy_options: {
      repo: 'rauversion/minimal-artist-theme',
      ref: 'main',
      env: 'production'
    }
  }
]

themes.each do |theme_data|
  theme = Theme.find_or_create_by(name: theme_data[:name]) do |t|
    t.system_theme = theme_data[:system_theme]
    t.description = theme_data[:description]
    t.deploy_options = theme_data[:deploy_options]
  end
  
  puts "Created/found theme: #{theme.name}"
end
