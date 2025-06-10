class Kifu < ApplicationRecord
  belongs_to :user
  belongs_to :category
  alias_attribute :kifu_text, :body

  validates :title, :body, :category, presence: true
end
