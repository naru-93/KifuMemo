Rails.application.routes.draw do
  get 'kifus/show'
  get 'kifu/show'
  devise_for :users
  root 'homes#top'

  resources :users, only: [:index, :show, :edit, :update]
  resources :kifus, only: [:show]
end
