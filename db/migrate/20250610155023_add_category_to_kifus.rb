class AddCategoryToKifus < ActiveRecord::Migration[6.1]
  def change
    add_reference :kifus, :category, null: false, foreign_key: true
  end
end
