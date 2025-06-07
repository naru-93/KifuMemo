// This file is automatically compiled by Webpack, along with any other files
// present in this directory. You're encouraged to place your actual application logic in
// a relevant structure within app/javascript and only use these pack files to reference
// that code so it'll be compiled.

import Rails from "@rails/ujs"
import Turbolinks from "turbolinks"
import * as ActiveStorage from "@rails/activestorage"
import "channels"
import "jquery";
import "popper.js";
import "bootstrap";
import "../stylesheets/application"
import '@fortawesome/fontawesome-free/js/all'

Rails.start()
Turbolinks.start()
ActiveStorage.start()

document.addEventListener("turbolinks:load", () => {
  const toggleBtn = document.getElementById("toggle-kifu-form");
  const formDiv = document.getElementById("kifu-form");
  const overlay = document.getElementById("kifu-overlay");

  if (toggleBtn && formDiv && overlay) {
    toggleBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const isHidden = formDiv.classList.contains("hidden");
      if (isHidden) {
        formDiv.classList.remove("hidden");
        overlay.style.display = "block";
      } else {
        formDiv.classList.add("hidden");
        overlay.style.display = "none";
      }
    });

    overlay.addEventListener("click", () => {
      formDiv.classList.add("hidden");
      overlay.style.display = "none";
    });
  }
});