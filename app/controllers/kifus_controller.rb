class KifusController < ApplicationController
  before_action :authenticate_user!

  def new
    @kifu       = current_user.kifus.build
    @categories = Category.all
  end

  def create
    @kifu     = current_user.kifus.build(kifu_params)
    if @kifu.save
      redirect_to @kifu, notice: '棋譜を保存しました'
    else
      @categories = Category.all
      render :new
    end
  end

  def show
    @kifu = Kifu.find(params[:id])
  end

  def edit
    @kifu = Kifu.find(params[:id])
    @categories = Category.all
  end

  def update
    @kifu = Kifu.find(params[:id])
    if @kifu.update(kifu_params)
      redirect_to @kifu, notice: '棋譜を更新しました'
    else
      @categories = Category.all
      render :edit
    end
  end

  def destroy
    @kifu.destroy
    redirect_to user_path(current_user), notice: '棋譜を削除しました'
  end

  private

  def set_kifu
    @kifu = current_user.kifus.find(params[:id])
  end

  def kifu_params
    params.require(:kifu).permit(
      :title,
      :moves,
      :category_id         
    )
  end
end