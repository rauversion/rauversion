require 'nokogiri'
require 'faraday'
require 'uri'
require 'csv'
require 'json'

module Scrappers
  class Mp
    # Fetch the page content and return a Nokogiri document.
    def self.fetch_page(url)
      response = Faraday.get(url)
      Nokogiri::HTML(response.body)
    end

    # Extracts links from elements with selectors ".grupo a" and ".artista a"
    # using the provided base_url to resolve relative links.
    def self.extract_links(doc, base_url)
      doc.css('.grupo a', '.artista a').map do |link|
        href = link['href']
        puts "Found link: #{href}"
        URI.join(base_url, href).to_s rescue href
      end
    end

    # Finds the "next posts" link for pagination using the provided base_url.
    def self.find_next_link(doc, base_url)
      next_link_element = doc.at_css('.nextpostslink')
      return nil unless next_link_element && next_link_element['href']
      URI.join(base_url, next_link_element['href']).to_s
    end

    # Scrapes all pages starting from start_url by following pagination.
    # Returns a unique array of links.
    def self.scrape_all(start_url)
      all_links = []
      current_url = start_url
      loop do
        puts "Fetching: #{current_url}"
        doc = fetch_page(current_url)
        all_links.concat(extract_links(doc, start_url))
        next_url = find_next_link(doc, start_url)
        break unless next_url
        current_url = next_url
      end
      all_links.uniq
    end

    # Saves the scraped unique links to a file.
    def self.save_links(start_url, filename = "links.txt")
      unique_links = scrape_all(start_url)
      File.open(filename, "w") do |file|
        unique_links.each { |link| file.puts(link) }
      end
      puts "Scraped #{unique_links.size} unique links. They have been saved to #{filename}."
    end

    # Scrapes an individual artist page and extracts relevant content.
    # Returns a hash with keys :name, :biography, and :tabs.
    def self.scrape_artist_page(url)
      puts "Fetching artist page: #{url}"
      doc = fetch_page(url)

      # Extract the artist's name using two possible selectors.
      artist_name = doc.at_css('h1.cont_titulo_grupo_f')&.text&.strip&.gsub(/\t/, '') ||
                    doc.at_css('span.title_grupo_int')&.text&.strip&.gsub(/\t/, '')

      # Extract biography text from available sections.
      biography = doc.at_css('div.bioPatriDesk .cont_extract_n')&.text&.strip&.gsub(/\t/, '') ||
                  doc.at_css('div.bioPatriMob .cont_extract_n')&.text&.strip&.gsub(/\t/, '') ||
                  doc.at_css('div.cont_extract_n')&.text&.strip&.gsub(/\t/, '')

      # Extract tab labels from the tabs controls.
      tab_labels = doc.css('ul.et_pb_tabs_controls li').map { |li| li.text.strip.gsub(/\t/, '') }

      # Extract each tab's content (remove script tags from each tab).
      tab_contents = doc.css('div.et_pb_all_tabs > div.et_pb_tab')
      tabs = {}
      tab_labels.each_with_index do |label, index|
        tab_contents[index].css("script").remove if tab_contents[index]
        tabs[label] = tab_contents[index] ? tab_contents[index].inner_text.strip.gsub(/\t/, '') : ""
      end

      { name: artist_name, biography: biography, tabs: tabs }
    end

    # Iterates over the provided artist links and saves the extracted data to a CSV file.
    # The CSV will have columns: URL, Name, Biography, and Tabs (stored as JSON).
    def self.save_artists_csv(artist_links, filename = "artists.csv")
      CSV.open(filename, "wb", headers: ["URL", "Name", "Biography", "Tabs"], write_headers: true) do |csv|
        artist_links.each do |link|
          begin
            data = scrape_artist_page(link)
            # Convert the tabs hash to a JSON string to store it in one CSV cell.
            csv << [link, data[:name], data[:biography], data[:tabs].to_json]
            puts "Processed: #{data[:name]}"
          rescue StandardError => e
            puts "Error processing #{link}: #{e.message}"
          end
        end
      end
      puts "All artist data has been saved to #{filename}."
    end
  end
end

# -------------------------------------------------------------------
# Example usage:
# 1. Define the starting URL.
# 2. Get the list of artist links.
# 3. Save the artist data to a CSV file.
# -------------------------------------------------------------------
#start_url = "https://www.musicapopular.cl/generos/electronica/"
#artist_links = Scrappers::Mp.scrape_all(start_url)
#puts "Total artist links scraped: #{artist_links.size}"


# artist_links = File.open("links.txt").readlines.map(&:chomp)
#Scrappers::Mp.save_artists_csv(artist_links)
