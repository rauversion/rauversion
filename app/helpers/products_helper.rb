module ProductsHelper
  def gradient_color(color)
    {
      'purple' => 'indigo',
      'blue' => 'cyan',
      'pink' => 'rose',
      'amber' => 'yellow',
      'emerald' => 'teal'
    }[color] || color
  end
end
