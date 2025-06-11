class UsersController < ApplicationController
before_action :authenticate_user! #ログインしていないユーザーのアクセス制限
before_action :correct_user, only: [:edit, :update] #correct_user = 編集対象がログインしている本人か確認するメソッド

  def index
    @users = User.all
  end

  def show
    @user = User.find(params[:id])
    @category_counts = @user.kifus.group(:category_id).count
    @categories = Category.all
    if params[:category_id].present?
      @kifus = @user.kifus.where(category_id: params[:category_id]).order(created_at: :desc)
    else
      @kifus = @user.kifus.order(created_at: :desc)
    end
  end

  def edit
    @user = User.find(params[:id])
  end

  def update
    @user = User.find(params[:id])
    if @user.update(user_params)
      redirect_to user_path(@user)
    else
      render :edit
    end
  end

  private

  def user_params
    params.require(:user).permit(:name, :email, :profile_image)
  end

  def correct_user
    @user = User.find(params[:id])
    redirect_to(root_path) unless @user == current_user
  end
end
