import books from "./data/books.js";

const App = {
  _colorSimilarityThreshold: 30,

  init: function () {
    this.addEventListener();
  },

  addEventListener: function () {
    $("#search-btn").on("click", () => {
      this.search();
    });
  },

  search: function () {
    let searchType = $("#search-type").val();
    let searchTerm = $("#search-term").val();

    const results = this.findInBooks(searchType, searchTerm);
    $("#results").empty();

    results.forEach((item) => {
      $("#results").append(this.generateSwatch(item));
    });
  },

  generateSwatch: function (item) {
    return `<div class="swatch col-md-4 mt-2">
              <div class="card">
                <div class="color" style="background-color: #${item?.hex}; height: 40px;"></div>
                <div class="card-body">              
                  <p class="swatch-name">Name: ${item?.name}</p>
                  <p class="swatch-hex">HEX: ${item?.hex}</p>
                  <p class="swatch-rgb">RGB: ${item?.rgb}</p>
                  <p class="swatch-cmyk">CMYK: ${item?.cmyk}</p>
                  <p class="swatch-similarity">Similarity: ${item?.similarity?.toFixed(2)}%</p>
                </div>
              </div>
            </div>`;
  },

  findInBooks: function (searchType, searchTerm) {
    let fullResults = [];
    for (let bookName in books) {
      let book = books[bookName];
      let colors = book.getColors();
      let results = [];

      switch (searchType) {
        case "name":
          results = Object.values(colors).reduce((arr, color) => {
            let similarityPercentage = this.levenshteinSimilarity(searchTerm, color?.name);
            if (color?.name?.includes(searchTerm) || similarityPercentage >= 93) {
              arr.push({...color, similarity: similarityPercentage});
            }
            return arr;
          }, []);
          break;
        case "colorCode":
          results = Object.values(colors).reduce((arr, color) => {
            let similarityPercentage = this.levenshteinSimilarity(searchTerm, color?.colorCode);
            if (color?.colorCode?.includes(searchTerm) || similarityPercentage >= 93) {
              arr.push({...color, similarity: similarityPercentage});
            }
            return arr;
          }, []);
          break;
        case "hex":
          if (searchTerm.length >= 3) {
            if (Object.values(colors).length) {
              results = Object.values(colors).reduce((arr, color) => {
                let [isSimilar, similarityPercentage] = this.isColorSimilar(searchTerm, color.hex);
                if (color?.hex?.startsWith(searchTerm) || isSimilar) {
                  arr.push({...color, similarity: similarityPercentage});
                }
                return arr;
              }, []);
            }
          }
          break;
        case "rgb":
          if (searchTerm.length >= 3) {
            let rgbParts = searchTerm.split(",");
            let baseHex = this.rgbToHex((rgbParts[0] || 0), (rgbParts[1] || 0), (rgbParts[2] || 0))

            results = Object.values(colors).reduce((arr, color) => {
              let [isSimilar, similarityPercentage] = this.isColorSimilar(baseHex, color.hex);
              if (color?.rgb?.startsWith(searchTerm) || isSimilar) {
                arr.push({...color, similarity: similarityPercentage});
              }

              return arr;
            }, []);
          }
          break;
        case "cmyk":
          if (searchTerm.length >= 2) {
            let cmykParts = searchTerm.split(",");
            let cmykRgb = this.cmykToRgb(
              (cmykParts[0] || 0),
              (cmykParts[1] || 0),
              (cmykParts[2] || 0),
              (cmykParts[3] || 0)
            );
            let baseHex = this.rgbToHex(cmykRgb.r, cmykRgb.g, cmykRgb.b);
            results = Object.values(colors).reduce((arr, color) => {
              let [isSimilar, similarityPercentage] = this.isColorSimilar(baseHex, color.hex);
              if (color?.cmyk?.startsWith(searchTerm) || isSimilar) {
                arr.push({...color, similarity: similarityPercentage});
              }
              return arr;
            }, []);
          }
          break;
      }
      fullResults = fullResults.concat(results);
    }

    fullResults = fullResults.sort((a, b) => b.similarity - a.similarity);

    return fullResults;
  },

  // Function to convert CMYK to RGB
  cmykToRgb: function (c, m, y, k) {
    // Normalize CMYK values (0–100) to the range [0, 1]
    let cPcnt = Number(String(c).trim()) / 100;
    let mPcnt = Number(String(m).trim()) / 100;
    let yPcnt = Number(String(y).trim()) / 100;
    let kPcnt = Number(String(k).trim()) / 100;

    // Calculate RGB values
    const r = 255 * (1 - cPcnt) * (1 - kPcnt);
    const g = 255 * (1 - mPcnt) * (1 - kPcnt);
    const b = 255 * (1 - yPcnt) * (1 - kPcnt);

    // Return the RGB values as integers
    return {
      r: Math.round(r),
      g: Math.round(g),
      b: Math.round(b)
    };
  },

  // Convert Hex to RGB
  hexToRgb: function (hex) {
    // Remove the '#' if it exists
    hex = hex.replace(/^#/, '');

    // Convert the hex color to RGB values
    if (hex.length === 6) {
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16)
      };
    } else if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16)
      };
    }
    return null;
  },

  rgbToHex: function (r, g, b) {
    // Ensure the values are between 0 and 255
    let rHex = Math.max(0, Math.min(255, Number(String(r).trim())));
    let gHex = Math.max(0, Math.min(255, Number(String(g).trim())));
    let bHex = Math.max(0, Math.min(255, Number(String(b).trim())));

    // Convert each RGB value to a 2-digit hex string and concatenate them
    const hex = "#" +
      rHex.toString(16).padStart(2, '0') +
      gHex.toString(16).padStart(2, '0') +
      bHex.toString(16).padStart(2, '0');

    return hex;
  },

  // Calculate the Euclidean distance between two colors in RGB
  colorDistance: function (color1, color2) {
    return Math.sqrt(
      Math.pow(color1.r - color2.r, 2) +
      Math.pow(color1.g - color2.g, 2) +
      Math.pow(color1.b - color2.b, 2)
    );
  },

  // Function to find similar colors
  isColorSimilar: function (baseHex, secondHex) {
    const baseColor = this.hexToRgb(baseHex);
    if (!baseColor) {
      return [false, 0];
    }

    const colorRgb = this.hexToRgb(secondHex);
    if (colorRgb) {
      const distance = this.colorDistance(baseColor, colorRgb);
      if (distance <= this._colorSimilarityThreshold) {
        // maxDistance is the distance between black (0,0,0) and white (255,255,255)
        const maxDistance = 441.6729559300637;
        const similarity = Math.max(0, Math.min(100, ((1 - (distance / maxDistance)) * 100)));
        return [true, similarity];
      }
    }
    return [false, 0];
  },

  // Function to calculate Levenshtein distance
  levenshtein: function (a, b) {
    const tmp = [];
    let i, j, alen = a.length, blen = b.length, res;

    // If one of the strings is empty
    if (alen === 0) return blen;
    if (blen === 0) return alen;

    // Create the distance matrix
    for (i = 0; i <= alen; i++) tmp[i] = [i];
    for (j = 0; j <= blen; j++) tmp[0][j] = j;

    // Populate the matrix
    for (i = 1; i <= alen; i++) {
      for (j = 1; j <= blen; j++) {
        res = a[i - 1] === b[j - 1] ? 0 : 1;
        tmp[i][j] = Math.min(
          tmp[i - 1][j] + 1,     // Deletion
          tmp[i][j - 1] + 1,     // Insertion
          tmp[i - 1][j - 1] + res // Substitution
        );
      }
    }

    // Return the Levenshtein distance
    return tmp[alen][blen];
  },

// Function to calculate similarity percentage based on Levenshtein distance
  levenshteinSimilarity: function (a, b) {
    const maxLen = Math.max(a.length, b.length);
    const distance = this.levenshtein(a, b);
    const similarity = ((maxLen - distance) / maxLen) * 100; // Normalize to percentage
    return similarity;
  }

};
$(document).ready(function () {
  App.init();
});