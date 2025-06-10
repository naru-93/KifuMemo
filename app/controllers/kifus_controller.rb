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

  def index
    @kifus = current_user.kifus.order(created_at: :desc)
  end

  private

  def kifu_params
    params.require(:kifu).permit(
      :title,
      :moves,
      :category_id         
    )
  end
end