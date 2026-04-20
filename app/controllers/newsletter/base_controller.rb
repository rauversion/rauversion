module Newsletter
  class BaseController < ApplicationController
    include RequiresNewsletterAccess
  end
end
