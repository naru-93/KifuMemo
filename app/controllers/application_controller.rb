class ApplicationController < ActionController::Base
  before_action :authenticate_user!, except: [:top, :about]
  before_action :configure_permitted_parameters, if: :devise_controller?

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name])
    devise_parameter_sanitizer.permit(:account_update, keys: [:name])
  end  

  # サインイン後、直接user_showへ
  def after_sign_in_path_for(resource)
    user_path(resource)
  end
  # サインアップ後、直接use_showへ
  def after_sign_up_path_for(resource)
    user_path(resource)
  end

  before_action :set_categories

  def set_categories
    @categories = Category.all
  end
end
