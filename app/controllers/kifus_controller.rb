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
  
    # KIF -> JKF変換
    kif_parser = Jkf::Parser::Kif.new
    @jkf = kif_parser.parse(@kifu.moves)
  
    respond_to do |format|
      format.html # @kifu, @jkf がビューに渡る
      format.json { render json: @jkf }
    end

    @comments_hash = @kifu.comments.pluck(:move_number, :body).to_h
  end

  def edit
    @kifu = Kifu.find(params[:id])
    @categories = Category.all
  end

  def update
    @kifu = Kifu.find(params[:id])
    if @kifu.update(kifu_params)
      redirect_to user_path(current_user), notice: '棋譜を更新しました'
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