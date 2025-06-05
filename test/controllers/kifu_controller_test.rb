require "test_helper"

class KifuControllerTest < ActionDispatch::IntegrationTest
  test "should get show" do
    get kifu_show_url
    assert_response :success
  end
end
