class CreateComments < ActiveRecord::Migration[6.1]
  def change
    create_table :comments do |t|
      t.references :kifu, null: false, foreign_key: true
      t.integer :move_number
      t.text :body

      t.timestamps
    end
  end
end
