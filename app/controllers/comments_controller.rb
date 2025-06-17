class CommentsController < ApplicationController
  # CSRF保護をスキップ（APIなので）。ただし、実際のアプリケーションでは適切な認証・認可を追加してください。
  skip_before_action :verify_authenticity_token

  def create_or_update
    kifu = Kifu.find(params[:kifu_id])
    move_number = params[:move_number]
    body = params[:body]

    # 指定された手数にコメントがあれば探し、なければ新しく準備する
    comment = kifu.comments.find_or_initialize_by(move_number: move_number)
    
    if body.present?
      # コメント本文があれば更新して保存
      comment.body = body
      if comment.save
        render json: { status: 'success', comment: comment }, status: :ok
      else
        render json: { status: 'error', errors: comment.errors.full_messages }, status: :unprocessable_entity
      end
    else
      # コメント本文が空なら、そのコメントをデータベースから削除
      comment.destroy if comment.persisted?
      render json: { status: 'success', message: 'Comment deleted' }, status: :ok
    end
  end
end
