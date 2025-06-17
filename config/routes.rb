Rails.application.routes.draw do
  get 'kifus/show'
  get 'kifu/show'
  devise_for :users
  root 'homes#top'
  resources :kifus do
    post 'comments', to: 'comments#create_or_update'
  end

  resources :users
  resources :kifus
end
