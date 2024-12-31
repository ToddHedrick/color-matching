import Api from "./src/api.js";
import Storage from "./src/storage.js";
import Utils from "./src/utils.js";
import DateTime from "./src/DateTime.js";

const App = {
    defaultSyncDate: "2000-01-01T00:00:00",

    _colorSimilarityThreshold: 30,
    _levenshteinLengthThreshold: 7,
    _levenshteinBoostFactor: 1.15,

    searchTypes: ["colorCode", "hex", "rgb", "cmyk", "name"],

    init: async function () {
        this.fetchMetadata();
        this.addEventListeners();

        let lastSourcesSyncDate = await Storage.retrieveRecord("metadata", "localSourcesLastSyncDate");
        let lastSourcesSyncDateValue = (typeof lastSourcesSyncDate === "object" && lastSourcesSyncDate !== null) ? lastSourcesSyncDate?.value || this.defaultSyncDate : this.defaultSyncDate;
        let sourcesCount = await Storage.tableCount("sources");
        if (sourcesCount === 0) {
            lastSourcesSyncDateValue = this.defaultSyncDate;
        }

        this.buildSourcesCacheAndDropdown(1, 50, lastSourcesSyncDateValue);

        let lastColorSwatchesSyncDate = await Storage.retrieveRecord("metadata", "localColorSwatchesLastSyncDate");
        let lastColorSwatchesSyncDateValue = (typeof lastColorSwatchesSyncDate === "object" && lastColorSwatchesSyncDate !== null) ? lastColorSwatchesSyncDate?.value || this.defaultSyncDate : this.defaultSyncDate;
        let colorSwatchCount = await Storage.tableCount("color_swatches");
        if (colorSwatchCount === 0) {
            lastColorSwatchesSyncDateValue = this.defaultSyncDate;
        }

        this.buildColorSwatchCache(1, 50, lastColorSwatchesSyncDateValue);
    },

    fetchMetadata: async function () {
        Api.call("GET", Api.buildUrl("metadata"), null, {
            success: async (records) => {
                await Storage.putRecords("metadata", records);
            }
        });
    },

    buildColorSwatchCache: function (page, per_page, syncDate) {
        if (!page) {
            page = 1;
        }
        if (!per_page) {
            per_page = 50;
        }

        this.showAlert("fetching color swatches");

        Api.call("GET", Api.buildUrl("colorSwatches", {
            syncDate: syncDate || this.defaultSyncDate,
            page: page,
            per_page: per_page
        }), null, {
            success: async (colorSwatches) => {
                await Storage.putRecords("color_swatches", colorSwatches);
                if (colorSwatches.length >= per_page) {
                    this.buildColorSwatchCache(++page, per_page, syncDate);
                } else {
                    let lastSyncDate = {
                        "id": "localColorSwatchesLastSyncDate",
                        "value": (new DateTime()).modify("T-10M").format("Y-m-d\\TH:i:s", true)
                    };
                    await Storage.putRecord("metadata", lastSyncDate);
                    this.closeAlert();
                }
            }
        });
    },

    addEventListeners: function () {
        $("#search-btn").on("click", () => {
            this.search();
        });

        $("#search-term").keypress((event) => {
            if (event.which === 13) { // 13 is the keycode for Enter
                // Code to execute when Enter is pressed
                this.search();
            }
        });

        $("#closePopup").on("click", () => {
            this.closeAlert();
        });

        $(".create-new-btn").on("click", () => {
            this.createNewSwatch();
        });
    },

    buildSourcesCacheAndDropdown: function (page, per_page, syncDate) {
        if (!page) {
            page = 1;
        }
        if (!per_page) {
            per_page = 50;
        }

        Api.call("GET", Api.buildUrl("sources", {
            syncDate: syncDate || this.defaultSyncDate,
            page: page,
            per_page: per_page

        }), null, {
            success: async (records) => {
                await Storage.putRecords("sources", records);
                if (records.length >= per_page) {
                    this.buildSourcesCacheAndDropdown(++page, per_page, syncDate);
                } else {
                    let lastSyncDate = {
                        "id": "localSourcesLastSyncDate",
                        "value": (new DateTime()).modify("T-10M").format("Y-m-d\\TH:i:s", true)
                    };
                    await Storage.putRecord("metadata", lastSyncDate);
                    this._buildSourcesDropdown()
                }
            }
        });
    },

    _buildSourcesDropdown: async function () {
        $("#new-source").append($("<option></option>")
            .attr("value", "")
            .text(""));

        for await (let source of Storage.retrieveAllRecords("sources")) {
            $("#new-source").append($("<option></option>")
                .attr("value", source.id)
                .text(source.name));
        }
    },

    search: async function () {
        let searchTerm = $("#search-term").val();

        const $resultsElem = $("#results");
        $resultsElem.empty();
        $resultsElem.append(this.generateSpinner());

        let allItems = [];
        for await (let record of Storage.retrieveAllRecords("color_swatches")) {
            console.log("Here", record)
            allItems = allItems.concat(Utils.findMatchingValuesInRecords([record], searchTerm));
        }
        allItems = allItems.sort((a, b) => b.similarity - a.similarity);
        $resultsElem.empty();
        allItems.forEach((item) => {
            $resultsElem.append(this.generateSwatch(item));
        });
    },

    createNewSwatch: function () {
        return;
        Api.call("POST", Api.buildUrl("colorSwatches"), {
            sourceId: $("#new-source").val(),
            colorCode: $("#new-colorCode").val(),
            hex: $("#new-hex").val(),
            rgb: $("#new-rgb").val(),
            cmyk: $("#new-cmyk").val(),
            location: $("#new-location").val(),
        }, {
            success: async (record) => {
                await Storage.putRecord("color_swatches", record);
            }
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
    },

    showAlert: function (content) {
        this.closeAlert();
        $("#main").prepend(
            $(`<div class="alert alert-warning alert-dismissible fade show" role="alert">
                <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Info:"><use xlink:href="#info-fill"/></svg>
                <span class="alert-content">${content}</span>
                <button type="button" class="alert-btn-close btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>`)
        );
    },

    closeAlert: function () {
        $(".alert-btn-close").trigger("click");
    },
};
$(document).ready(function () {
    App.init();
});