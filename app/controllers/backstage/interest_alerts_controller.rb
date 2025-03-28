module Backstage
  class InterestAlertsController < Backstage::BaseController
   
    def model_class
      InterestAlert
    end
  
    def permitted_params
      params.require(:intereset_alert).permit(:email, :username, :role, :editor)
    end
    
  end
end