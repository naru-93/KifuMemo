class CreateKifus < ActiveRecord::Migration[6.1]
  def change
    create_table :kifus do |t|
      t.string :title
      t.text :moves

      t.timestamps
    end
  end
end
