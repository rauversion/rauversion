class ErrorsController < ApplicationController

  def not_found
    respond_to do |format|
      format.text { render "404", layout: "errors" }
      format.html { render "404", layout: "errors" }
      format.json { render json: { error: "Not Found", status: 404 } }
      format.text { render plain: "Not Found", status: 404 }
      format.xml  { render xml: { error: "Not Found", status: 404 }.to_xml }
 
    end
  end

  def fatal
    respond_to do |format|
      format.html { render "500", layout: "errors", status: :internal_server_error }
      format.json { render json: { error: "Internal Server Error", status: 500 }, status: :internal_server_error }
      format.text { render plain: "Internal Server Error", status: :internal_server_error }
      format.xml  { render xml: { error: "Internal Server Error", status: 500 }.to_xml, status: :internal_server_error }
    end
  end

  def not_allowed
    respond_to do |format|
      format.html { render "422", layout: "errors" }
      format.json { render json: { error: "Not Allowed", status: 422 } }
      format.text { render plain: "Not Allowed", status: 422 }
      format.xml  { render xml: { error: "Not Allowed", status: 422 }.to_xml }
     end
  end
end
