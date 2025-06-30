class Kifu < ApplicationRecord
  belongs_to :user
  belongs_to :category
  has_many :comments, dependent: :destroy
  alias_attribute :kifu_text, :moves

  validates :title, :moves, :category, presence: true
end
