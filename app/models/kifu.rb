class Kifu < ApplicationRecord
  belongs_to :user
  belongs_to :category
  alias_attribute :kifu_text, :moves

  validates :title, :moves, :category, presence: true
end
