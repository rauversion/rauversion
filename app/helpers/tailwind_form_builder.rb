class TailwindFormBuilder < ActionView::Helpers::FormBuilder
  # include ActionView::Helpers::TagHelper
  # include ActionView::Context

  def hint(attribute, options)
    return "" if options[:hint].blank? && hint_tr(attribute).blank?

    @template.tag.div(class: "text-gray-500 text-xs") do
      options[:hint] || hint_tr(attribute)
    end
  end

  def error(attribute, object)
    return if object.blank?
    return "" if object.errors[attribute.to_sym].blank?

    @template.tag.div(class: "text-red-500 text-xs italic") do
      object.errors[attribute.to_sym].uniq.join(", ").to_s
    end
  end

  def field_details(attribute, object, options)
    content = (error(attribute, object) + hint(attribute, options)).html_safe
    return "" if content.blank?

    @template.tag.div(class: "mt-1 text-xs text-gray-500 dark:text-gray-100") do
      (error(attribute, object) + hint(attribute, options)).html_safe
    end
  end

  def text_field(attribute, options = {})
    @template.content_tag :div, class: "w-full sm:w-full" do
      [
        options[:label].is_a?(FalseClass) ? @template.content_tag(:div) : @template.label_tag(tr(options[:label] || attribute), nil),
        super(attribute, options.reverse_merge(class: "input")),
        field_details(attribute, object, options)
      ].join.html_safe
    end
  end

  def url_field(attribute, options = {})
    @template.content_tag :div, class: "w-full sm:w-full" do
      [
        options[:label].is_a?(FalseClass) ? @template.content_tag(:div) : @template.label_tag(tr(options[:label] || attribute), nil),
        super(attribute, options.reverse_merge(class: "input")),
        field_details(attribute, object, options)
      ].join.html_safe
    end
  end

  def email_field(attribute, options = {})
    @template.content_tag :div, class: "w-full sm:w-full" do
      [
        options[:label].is_a?(FalseClass) ? @template.content_tag(:div) : @template.label_tag(tr(options[:label] || attribute), nil),
        super(attribute, options.reverse_merge(class: "input")),
        field_details(attribute, object, options)
      ].join.html_safe
    end
  end

  def password_field(attribute, options = {})
    @template.content_tag :div, class: "w-full sm:w-full" do
      [
        options[:label].is_a?(FalseClass) ? @template.content_tag(:div) : @template.label_tag(tr(options[:label] || attribute), nil),
        super(attribute, options.reverse_merge(class: "input")),
        field_details(attribute, object, options)
      ].join.html_safe
    end
  end

  def number_field(attribute, options = {})
    @template.tag.div(class: "w-full sm:w-full py-2") do
      [
        options[:label].is_a?(FalseClass) ? @template.content_tag(:div) : @template.label_tag(tr(options[:label] || attribute), nil),
        super(attribute, options.reverse_merge(class: "input")),
        field_details(attribute, object, options)
      ].join.html_safe
    end
  end

  def link_field(attribute, options = {})
    @template.tag.div(class: "w-full sm:w-full py-2") do
      @template.label_tag(tr(options[:label] || attribute), nil) +
        @template.tag.div(class: "flex") do
          @template.tag.span(class: "inline-flex items-center px-3 text-sm text-gray-900 dark:bg-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600") do
            options[:link]
          end +
            @template.tag.input(name: "#{object.class.table_name.singularize}[#{attribute}]", value: object.send(attribute), class: "rounded-none rounded-r-lg bg-gray-50 border text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm border-gray-300 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500")
        end + field_details(attribute, object, options)
    end
  end

  def right_indicator_field(attribute, options = {})
    @template.tag.div(class: "w-full sm:w-full py-2") do
      @template.label_tag(tr(options[:label] || attribute), nil) +
        @template.tag.div(class: "flex") do
          @template.tag.input(name: "#{object.class.table_name.singularize}[#{attribute}]", value: object.send(attribute), class: "rounded-none rounded-l-lg bg-gray-50 border text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm border-gray-300 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500") +
            @template.tag.span(class: "inline-flex items-center px-3 text-sm text-gray-900 dark:bg-gray-900 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600") do
              options[:link]
            end
        end + field_details(attribute, object, options)
    end
  end

  def text_area(attribute, options = {})
    @template.tag.div(class: "w-full sm:w-full py-2") do
      @template.label_tag(tr(options[:label] || attribute), nil) +
        super(attribute, options.reverse_merge(class: "")) +
        field_details(attribute, object, options)
    end
  end

  # def select_field(object_name, method_name, template_object, options = {})
  #  puts options
  #  @template.tag.div(class: "w-full sm:w-full py-2", "data-controller": "select") do
  #    @template.label_tag(tr(options[:label] || object_name), nil) +
  #      super(object_name, method_name, template_object, options.reverse_merge(class: "select")) +
  #      @template.tag.div(data: {"select-target": "holder"}) { "" } +
  #      field_details(object_name, object, options)
  #  end
  # end

  def color_fieldssss(object_name, method = "", options = {})
    Tags::ColorField.new(object_name, method, self, options).render
  end

  def div_radio_button(method, tag_value, options = {})
    @template.tag.div(@template.radio_button(
                        @object_name, method, tag_value, objectify_options(options)
                      ))
  end

  def radio_button(method, value, options = {})
    options.merge!(class: "form-radio mr-2 h-4 w-4 text-indigo-600 transition duration-150 ease-in-out") unless options.has_key?(:class)

    label_content = if options[:label] == false
                      ""
                    else
                      @template.label_tag(
                        tr(options[:label] || method), nil,
                        class: "block text-sm leading-5 text-muted"
                      )
                    end

    @template.tag.div(class: "inline-flex space-x-2 items-center #{options[:wrapper_class]}") do
      super + label_content +
        @template.tag.div(class: "text-sm font-normal leading-5 text-muted") do
          field_details(method, object, options)
        end
    end
  end

  def check_box(method, options = {}, checked_value = "1", unchecked_value = "0")
    info = ""
    unless options[:label] == false
      info = @template.label_tag(
        tr(options[:label] || method), nil,
        class: "block text-gray-500 dark:text-white text-md font-bold pt-1"
      )
    end

    options.merge!(class: "self-center mt-1-- mr-2 form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out") unless options.key?(:class)

    hint_content = ""
    if options[:hint].present?
      hint_text = options[:hint].is_a?(Proc) ? @template.capture(&options[:hint]) : options[:hint]
      hint_content = @template.content_tag(:p, hint_text.html_safe, class: "mt-1 text-sm text-gray-500")
    end

    @template.tag.div(class: "flex items-center space-x-2") do
      checkbox = @template.check_box(
        @object_name, method, objectify_options(options), checked_value, unchecked_value
      )
      label_and_hint = @template.tag.div(class: "flex-col items-center") do
        (info + hint_content).html_safe
      end
      checkbox + label_and_hint
    end
  end


  def uploader_field(method, tag_value = "", options = {})
    @template.tag.div(class: "overflow-hidden relative w-64 mt-4 mb-4") do
      @template.tag.div("data-controller": "upload-preview") do
        @template.image_tag("logo.png", width: "100px", hight: "100px", "data-upload-preview-target": "output") +
          @template.tag.div(class: "") do
            @template.label_tag(method) +
              @template.file_field_tag(method,
                "data-action": "upload-preview#readURL",
                "data-upload-preview-target": "input",
                class: "form-control-file photo_upload cursor-pointer absolute block py-2 px-4 w-full opacity-0 pin-r pin-t")
          end
      end +
        %(
  				<button class="bg-gray-300 hover:bg-blue-light text-white font-bold py-2 px-4 w-full inline-flex items-center">
  					<svg fill="#FFF" height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
  						<path d="M0 0h24v24H0z" fill="none"/>
  							<path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
  					</svg>
  					<span class="ml-2">Upload Document</span>
  				</button>
  			).html_safe
    end
  end

  def file_preview_field(method, tag_value = "", options = {})
    @template.content_tag :div, class: "overflow-hidden relative w-64 mt-4 mb-4" do
      @template.content_tag :div, "data-controller": "image-preview" do
        [
          file_field(method, options.merge(data: {action: "change->image-preview#preview", "image-preview-target": "file"}, class: "hidden")),
          @template.image_tag(tag_value, data: {"image-preview-target": "output"}, class: "p-4 w-[100px]"),
          label(method, "Upload file", class: "rounded-full cursor-pointer bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600")
        ].join.html_safe
      end
    end
  end

  def tr(name)
    I18n.t("activerecord.forms.#{@object_name}.#{name}.label", default: name.to_s)
    # I18n.t(name, scope: [:activerecord, :attributes, @object_name], :default => name.to_s)
  end

  def hint_tr(name)
    I18n.t("activerecord.forms.#{@object_name}.#{name}.hint", default: nil)
  end
end
