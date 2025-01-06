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

        this.buildSourcesCacheAndDropdown(1, 100, lastSourcesSyncDateValue);

        let lastColorSwatchesSyncDate = await Storage.retrieveRecord("metadata", "localColorSwatchesLastSyncDate");
        let lastColorSwatchesSyncDateValue = (typeof lastColorSwatchesSyncDate === "object" && lastColorSwatchesSyncDate !== null) ? lastColorSwatchesSyncDate?.value || this.defaultSyncDate : this.defaultSyncDate;
        let colorSwatchCount = await Storage.tableCount("color_swatches");
        if (colorSwatchCount === 0) {
            lastColorSwatchesSyncDateValue = this.defaultSyncDate;
        }

        this.buildColorSwatchCache(1, 100, lastColorSwatchesSyncDateValue);

        this.processHash();
    },

    processHash: function () {
        const currentUrl = new URL(window.location.href);
        const currentPage = currentUrl.hash.split("/")[0];
        if (currentPage === "#search") {
            const hashPieces = currentUrl.hash.split("/");
            if (hashPieces.length >= 2) {
                const $searchTermElem = $("#search-term");
                const currentSearchTerm = $searchTermElem.val();
                const hashSearchTerm = decodeURI(hashPieces[1]);
                if (currentSearchTerm !== hashSearchTerm) {
                    $searchTermElem.val(hashSearchTerm);
                    $("#colorPicker").val(`#${hashSearchTerm}`);
                    this.search();
                }
            }
        }
    },

    initiateBackgroundFetch: function (type) {
        setTimeout(() => {
            if (type === "color_swatches") {
                Storage.retrieveRecord("metadata", "localColorSwatchesLastSyncDate").then((syncDate) => {
                    let syncDateValue = (typeof syncDate === "object" && syncDate !== null) ? syncDate?.value || this.defaultSyncDate : this.defaultSyncDate;
                    this.buildColorSwatchCache(1, 100, syncDateValue, true)
                });
            }

            if (type === "sources") {
                Storage.retrieveRecord("metadata", "localSourcesLastSyncDate").then((syncDate) => {
                    let syncDateValue = (typeof syncDate === "object" && syncDate !== null) ? syncDate?.value || this.defaultSyncDate : this.defaultSyncDate;
                    this.buildSourcesCacheAndDropdown(1, 100, syncDateValue, true)
                });
            }

        }, 3 * 60 * 1000); // every 3 minutes
    },

    fetchMetadata: async function () {
        Api.call("GET", Api.buildUrl("metadata"), null, {
            success: async (records) => {
                await Storage.putRecords("metadata", records);
            }
        });
    },

    buildColorSwatchCache: function (page, per_page, syncDate, silentUpdate) {
        if (!page) {
            page = 1;
        }
        if (!per_page) {
            per_page = 50;
        }

        if (!silentUpdate) {
            this.showToast(`downloading color swatches (${page})...`);
        }

        Api.call("GET", Api.buildUrl("colorSwatches", {
            syncDate: syncDate || this.defaultSyncDate,
            page: page,
            per_page: per_page
        }), null, {
            success: async (colorSwatches) => {
                await Storage.putRecords("color_swatches", colorSwatches);
                if (colorSwatches.length >= per_page) {
                    this.closeToast();
                    this.buildColorSwatchCache(++page, per_page, syncDate, silentUpdate);
                } else {
                    let lastSyncDate = {
                        "id": "localColorSwatchesLastSyncDate",
                        "value": (new DateTime()).modify("T-2M").format("Y-m-d\\TH:i:s", true)
                    };
                    await Storage.putRecord("metadata", lastSyncDate);
                    this.closeToast();
                    this.initiateBackgroundFetch("color_swatches");
                }
            }
        });
    },

    addEventListeners: function () {
        window.addEventListener("hashchange", () => {
            this.processHash();
        });

        $("#search-btn").on("click", () => {
            this.search();
        });

        $("#search-term").keypress((event) => {
            if (event.which === 13) { // 13 is the keycode for Enter
                // Code to execute when Enter is pressed
                this.search();
            }
        });

        $("#new-source").on("change", () => {
            this.updateColorCodePrefixAndSuffix();
        });

        $(".create-new-btn").on("click", () => {
            this.createNewSwatch();
        });

        $(document).on("click", ".add-related-btn", (event) => {
            this.addRelatedSwatch(event.target.dataset.id)
        });

        $(document).on("click", ".toast-btn-close", (event) => {
            this.closeToast();
        });

        $(document).on("click", ".copy-to-clipboard", (event) => {
            this.copyToClipboard(event);
        });

        $(document).on("click", ".click-to-search", (event) => {
            $("#search-term").val($(event.target).data('value'));
            this.search();
        });

        $(document).on("click", ".source-filter-checkbox", (event) => {
            let currentCheckedValue = $(event.target).attr('checked');
            if(currentCheckedValue){
                $(event.target).attr('checked', false);
            } else {
                $(event.target).attr('checked', true);
            }
            this.search();
        });

        $("#colorPicker").on("input", (event) => {
            let value = event.target.value;
            if (value.startsWith("#")) {
                value = value.replace("#", "");
            }
            $("#search-term").val(value.toUpperCase());
        });

        $("#colorPicker").on("change", () => {
            this.search();
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
                    this._buildSourcesDropdown();
                    this.initiateBackgroundFetch("sources");
                }
            }
        });
    },

    _buildSourcesDropdown: async function () {
        const $sourceFilterElem = $("#source-filter");
        $sourceFilterElem.html("");

        const $newSourceElem = $("#new-source");

        $newSourceElem.html("");
        $newSourceElem.append($("<option></option>")
            .attr("value", "")
            .text(""));

        for await (let source of Storage.retrieveAllRecords("sources")) {
            if (source?.delete) {
                continue;
            }
            let dropdownLabel = source.name;
            if(source.shortName && source.name !== source.shortName){
                dropdownLabel = `${dropdownLabel} (${source.shortName})`;
            }
            $newSourceElem.append($("<option></option>")
                .attr("value", source.id)
                .text(dropdownLabel));

            $sourceFilterElem.append(`<input type="checkbox" class="btn-check source-filter-checkbox" id="source-filter-${source.id}" value="${source.id}" autocomplete="off">
                <label class="btn btn-outline-secondary" for="source-filter-${source.id}">${source.shortName}</label>`);
        }
    },

    updateColorCodePrefixAndSuffix: async function () {
        const sourceObj = await Storage.retrieveRecord("sources", $("#new-source").val());
        $("#colorCodePrefix").html("");
        if (sourceObj?.colorCodePrefix) {
            $("#colorCodePrefix").html(sourceObj.colorCodePrefix);
        }

        $("#colorCodeSuffix").html("");
        if (sourceObj?.colorCodeSuffix) {
            $("#colorCodeSuffix").html(sourceObj.colorCodeSuffix);
        }
    },

    search: async function () {
        let searchTerm = $("#search-term").val();
        let sourceFilters = [];
        $('.source-filter-checkbox[checked="checked"]').each((idx, elem) => {
            sourceFilters.push($(elem).val());
        })

        history.pushState(null, null, `#search/${searchTerm}`);

        const $resultsElem = $("#results");
        $resultsElem.empty();
        $resultsElem.append(this.generateSpinner());

        let allItems = [];
        for await (let record of Storage.retrieveAllRecords("color_swatches")) {
            if (record?.deleted) {
                continue;
            }

            allItems = allItems.concat(Utils.findMatchingValuesInRecords([record], searchTerm, sourceFilters));

            if (!searchTerm) {
                if (allItems.length >= 50) {
                    break;
                }
            }
        }
        allItems = allItems.sort((a, b) => b.similarity - a.similarity);
        $resultsElem.empty();
        await allItems.forEach(async (item) => {
            $resultsElem.append(await this.generateSwatch(item));
        });
    },

    copyToClipboard: function (event) {
        // Copy the text inside the text field
        window.navigator.clipboard.writeText($(event.target).data('value'))
            .then(() => {
                this.showToast("copied...", true);
            })
            .catch();
    },

    validateCreateNewSwatch: function () {
        let isValid = true;
        const $sourceElem = $("#new-source");
        if (!$sourceElem.val()) {
            $sourceElem.addClass("is-invalid");
            isValid = false;
        } else {
            $sourceElem.removeClass("is-invalid");
        }

        const $colorCodeElem = $("#new-colorCode")
        if (!$colorCodeElem.val()) {
            $colorCodeElem.addClass("is-invalid");
            isValid = false;
        } else {
            $colorCodeElem.removeClass("is-invalid");
        }

        const $hexElem = $("#new-hex");
        const $rgbElem = $("#new-rgb");
        const $cmykElem = $("#new-cmyk");

        if (!$hexElem.val() && !$rgbElem.val() && !$cmykElem.val()) {
            $hexElem.addClass("is-invalid");
            $rgbElem.addClass("is-invalid");
            $cmykElem.addClass("is-invalid");
            isValid = false;
        } else {
            $hexElem.removeClass("is-invalid");
            $rgbElem.removeClass("is-invalid");
            $cmykElem.removeClass("is-invalid");
        }


        return isValid;
    },

    createNewSwatch: async function () {
        if (this.validateCreateNewSwatch()) {
            const sourceId = $("#new-source").val();
            let colorCode = $("#new-colorCode").val();
            if (sourceId) {
                const sourceObj = await Storage.retrieveRecord("sources", sourceId);
                if (sourceObj?.colorCodeSuffix) {
                    if (!colorCode.endsWith(sourceObj.colorCodeSuffix)) {
                        colorCode = colorCode + " " + sourceObj.colorCodeSuffix;
                    }
                }
            }

            this.showToast("saving...");
            Api.call("POST", Api.buildUrl("colorSwatches"), {
                sourceId: sourceId,
                colorCode: colorCode,
                hex: $("#new-hex").val(),
                rgb: $("#new-rgb").val(),
                cmyk: $("#new-cmyk").val(),
                location: $("#new-location").val(),
                relatedId: $("#new-relatedId").val()
            }, {
                success: async (record) => {
                    this.closeToast();
                    await Storage.putRecord("color_swatches", record);
                    $(".close-create-new-btn").trigger("click");
                    let lastColorSwatchesSyncDate = await Storage.retrieveRecord("metadata", "localColorSwatchesLastSyncDate");
                    let lastColorSwatchesSyncDateValue = (typeof lastColorSwatchesSyncDate === "object" && lastColorSwatchesSyncDate !== null) ? lastColorSwatchesSyncDate?.value || null : null;

                    if (lastColorSwatchesSyncDateValue) {
                        this.buildColorSwatchCache(1, 100, lastColorSwatchesSyncDateValue);
                    }
                },
                error: (error, responseDetails) => {
                    this.closeToast();
                    if (responseDetails?.status === 400) {
                        if (typeof error?.errorDetails === "object" && error?.errorDetails !== null) {
                            if (error?.errorDetails?.name === "ConditionalCheckFailedException") {
                                this.showToast("color swatch already exists");
                            }
                        }
                    }
                }
            });
        }
    },

    addRelatedSwatch: async function (relatedId) {
        const existingColorSwatch = await Storage.retrieveRecord("color_swatches", relatedId);
        if (existingColorSwatch) {
            $("#new-hex").val(existingColorSwatch?.hex || "");
            $("#new-rgb").val(existingColorSwatch?.rgb || "");
            $("#new-cmyk").val(existingColorSwatch?.cmyk || "");
            $("#new-relatedId").val(existingColorSwatch.id);
        } else {
            $("#new-relatedId").val("");
        }
        $("#new-source").val("");
        $("#colorCodePrefix").html("");
        $("#colorCodeSuffix").html("");

        $("#addNewSwatchBtn").trigger("click");
    },

    generateSpinner: function () {
        return `<div class="col-sm-12 mt-2"><div class="spinner"></div></div>`;
    },

    generateSwatch: async function (item) {
        let fields = [
            {"name": "colorCode", "label": "Color Code", "includeCopyAndSearchBtn": true},
            {"name": "hex", "label": "HEX", "includeCopyAndSearchBtn": true},
            {"name": "rgb", "label": "RGB", "includeCopyAndSearchBtn": true},
            {"name": "cmyk", "label": "CMYK", "includeCopyAndSearchBtn": true},
            {"name": "similarity", "label": "Similarity", "includeCopyAndSearchBtn": false},
            {"name": "matchedOn", "label": "Matched On", "includeCopyAndSearchBtn": false}
        ];

        let sourceName = "";
        if (item?.sourceId) {
            const sourceObj = await Storage.retrieveRecord("sources", item?.sourceId);
            if (sourceObj) {
                fields.push({"name": "sourceName", "label": "Source"})
                sourceName = sourceObj.name;
                if(sourceObj.shortName && sourceObj.name !== sourceObj.shortName){
                    sourceName = `${sourceName} (${sourceObj.shortName})`;
                }
            }
        }

        if (item?.location) {
            fields.push({"name": "location", "label": "Location"})
        }

        return `<div class="swatch col-lg-4 col-sm-6 mt-2" data-id="${item.id}">
              <div class="card">
                <div class="color" style="background-color: #${item?.hex}; height: 40px;"></div>
                <div class="card-body">
                <button type="button" class="add-related-btn btn btn-sm btn-outline-primary position-absolute end-20" data-id="${item.id}">+ Add Related</button>
                <div class="row">
                  <div class="col-8 card-title">Name: </div>
                  <div class="col-8">
                    <p class="swatch-name">${item.name}</p>
                  </div>
                </div>
        ${fields.map((fieldDef) => {
            let value = item[fieldDef.name];
            if (fieldDef.name === "similarity") {
                value = Number(value).toFixed(2) + "%";
            } else if (fieldDef.name === "sourceName") {
                value = sourceName;
            }

            let btns = (fieldDef.includeCopyAndSearchBtn) ? 
                `<div class="col-3"><i class="bi bi-copy copy-to-clipboard" data-value="${value}" title="Copy"></i>&nbsp;&nbsp;&nbsp;<i class="bi bi-search click-to-search" data-value="${value}" title="Search"></i></div>` 
                : '';
            
            let columnSize = (fieldDef.includeCopyAndSearchBtn) ? 'col-5' : 'col-8';

            return `<div class="row">
                    <div class="col-4 card-title">${fieldDef.label}: </div>
                    <div class="${columnSize}">
                        <p class="swatch-${fieldDef.name}">
                        ${value}
                        </p>
                    </div>
                    ${btns}
                </div>`;
        }).join("")}
                </div>
              </div>
            </div>`;
    },

    showAlert: function (content) {
        this.closeAlert();
        $("#main").prepend(
            $(`<div class="alert alert-warning alert-dismissible show" role="alert">
                <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Info:"><use xlink:href="#info-fill"/></svg>
                <span class="alert-content">${content}</span>
                <button type="button" class="alert-btn-close btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>`)
        );
    },

    closeAlert: function () {
        $(".alert-btn-close").trigger("click");
    },

    showToast: function (content, autoclose) {
        this.closeToast();
        $("#main").prepend($(
            `<div class="toast align-items-center show position-fixed end-20 bottom-55 zindex-top" role="alert" aria-live="assertive" aria-atomic="true">
              <div class="d-flex">
                <div class="toast-body">
                <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Info:"><use xlink:href="#info-fill"/></svg>&nbsp;${content}
               </div>
                <button type="button" class="btn-close me-2 m-auto toast-btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
              </div>
            </div>`
        ));

        if (autoclose) {
            setTimeout(() => {
                this.closeToast();
            }, 3 * 1000);
        }
    },

    closeToast: function () {
        $(".toast").remove();
    },
};
$(document).ready(function () {
    App.init();
});