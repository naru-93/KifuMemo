# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)
strategies = %w[
  矢倉 角換わり 相掛かり 三間飛車 四間飛車 中飛車 向かい飛車 横歩取り 雁木
]

strategies.each do |name|
  Category.find_or_create_by!(name: name)
end