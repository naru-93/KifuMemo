Rails.application.routes.draw do
  get 'users/show'
  get 'users/edit'
  devise_for :users
  root 'homes#top'
  resources :users, only: [:show, :edit]
end
