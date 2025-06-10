class Category < ApplicationRecord
  has_many :kifus
  validates :name, presence: true, uniqueness: true
end
