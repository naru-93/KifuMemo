require "test_helper"

class KifusControllerTest < ActionDispatch::IntegrationTest
  test "should get show" do
    get kifus_show_url
    assert_response :success
  end
end
