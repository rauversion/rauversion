xml.instruct! :xml, version: "1.0", encoding: "UTF-8"
xml.rss version: "2.0" do
  xml.channel do
    xml.title @user.podcaster_info.title
    xml.link root_url
    xml.description @user.podcaster_info.description
    xml.language "es-es"
    
    #xml.itunes :author, @user.full_name
    #xml.itunes :subtitle, "Subtítulo del Podcast"
    #xml.itunes :summary, @user.podcaster_info.description
    
    #xml.itunes :owner do
    #  xml.itunes :name, "Nombre del Propietario"
    #  xml.itunes :email, "email@ejemplo.com"
    #end

    xml.itunes :image, href: "http://www.ejemplo.com/imagen.jpg"
    xml.itunes :category, text: "Categoría del Podcast"

    @collection.each do |track|
      xml.item do
        xml.title track.title
        xml.description track.description
        xml.enclosure url: MediaStreamUrl.for(track.mp3_audio, only_path: false), type: "audio/mp3"
        xml.pubDate track.created_at
        xml.guid MediaStreamUrl.for(track.mp3_audio, only_path: false)
      end
    end
  end
end
