import Api from "./api.js";

const App = {
    _colorSimilarityThreshold: 30,
    _levenshteinLengthThreshold: 7,
    _levenshteinBoostFactor: 1.15,

    searchTypes: ["colorCode", "hex", "rgb", "cmyk", "name"],

    init: function () {
        this.addEventListener();
        this.buildDropdowns();
    },

    addEventListener: function () {
        $("#search-btn").on("click", () => {
            this.search();
        });

        $("#search-term").keypress((event) => {
            if (event.which === 13) { // 13 is the keycode for Enter
                // Code to execute when Enter is pressed
                this.search();
            }
        });
    },

    buildDropdowns: function () {

        $("#new-book").append($("<option></option>")
            .attr("value", "")
            .text(""));

        for (let bookId in books) {
            $("#new-book").append($("<option></option>")
                .attr("value", bookId)
                .text(books[bookId].name));
        }
    },

    search: function () {
        let searchTerm = $("#search-term").val();

        const $resultsElem = $("#results");
        $resultsElem.empty();
        $resultsElem.append(this.generateSpinner());
        Api.call("GET", Api.buildUrl("", {searchTerm: searchTerm}), null, {
            success: (results) => {
                $resultsElem.empty();
                results.forEach((item) => {
                    $resultsElem.append(this.generateSwatch(item));
                });
            },
            error: (data) => {
                $resultsElem.empty();
                console.error("ERROR :", data);
                $resultsElem.append(`<pre>${JSON.stringify(data, null, 2)}</pre>`)
            },
        });
    },

    generateSpinner: function () {
        return `<div class="col-sm-12 mt-2"><div class="spinner"></div></div>`;
    },

    generateSwatch: function (item) {
        return `<div class="swatch col-lg-4 col-sm-6 mt-2">
              <div class="card">
                <div class="color" style="background-color: #${item?.hex}; height: 40px;"></div>
                <div class="card-body">              
                  <p class="swatch-name card-title">Name: ${item?.name}</p>
                  <p class="swatch-hex">HEX: ${item?.hex}</p>
                  <p class="swatch-rgb">RGB: ${item?.rgb}</p>
                  <p class="swatch-cmyk">CMYK: ${item?.cmyk}</p>
                  <p class="swatch-similarity">Similarity: ${item?.similarity?.toFixed(2)}%</p>
                </div>
              </div>
            </div>`;
    }
};
$(document).ready(function () {
    App.init();
});