const Utils = {

    _colorSimilarityThreshold: 30,
    _levenshteinLengthThreshold: 7,
    _levenshteinBoostFactor: 1.15,

    searchTypes: ["colorCode", "hex", "rgb", "cmyk", "name"],

    getColorValue: function (returnType, fromType, fromValue) {
        if (fromType === "hex") {
            if (returnType === "rgb") {
                let rgbObj = this.hexToRgb(fromValue);
                return `${rgbObj.r},${rgbObj.g},${rgbObj.b}`;
            }

            if (returnType === "cmyk") {
                let rgbObj = this.hexToRgb(fromValue);
                let cmykObj = this.rgbToCmyk(rgbObj.r, rgbObj.g, rgbObj.b)
                return `${cmykObj.c},${cmykObj.m},${cmykObj.y},${cmykObj.k}`;
            }
        }

        if (fromType === "rgb") {
            let rgbObj = fromValue;

            if (typeof fromValue === "string") {
                let rgbArr = fromValue.split(",");
                rgbObj = {
                    r: rgbArr[0],
                    g: rgbArr[1],
                    b: rgbArr[2]
                };
            }

            if (returnType === "hex") {
                return this.rgbToHex(rgbObj.r, rgbObj.g, rgbObj.b);
            }

            if (returnType === "cmyk") {
                let cmykObj = this.rgbToCmyk(rgbObj.r, rgbObj.g, rgbObj.b);
                return `${cmykObj.c},${cmykObj.m},${cmykObj.y},${cmykObj.k}`;
            }
        }

        if (fromType === "cmyk") {
            let cmykObj = fromValue;

            if (typeof fromValue === "string") {
                let cmykArr = fromValue.split(",");
                cmykObj = {
                    c: cmykArr[0],
                    m: cmykArr[1],
                    y: cmykArr[2],
                    k: cmykArr[3]
                };
            }

            if (returnType === "hex") {
                let rgbObj = this.cmykToRgb(cmykObj.c, cmykObj.m, cykObj.y, cmykObj.k);
                return this.rgbToHex(rgbObj.r, rgbObj.g, rgbObj.b);
            }

            if (returnType === "rgb") {
                let rgbObj = this.cmykToRgb(cmykObj.c, cmykObj.m, cykObj.y, cmykObj.k);
                return `${rgbObj.r},${rgbObj.g},${rgbObj.b}`;
            }
        }

        return "";
    },

    findMatchingValuesInRecords: function (records, searchTerm, sourceFilters) {
        if (searchTerm === null || typeof searchTerm === "undefined" || !String(searchTerm).trim().length) {
            searchTerm = "";
        }

        let fullResults = [];
        if (!Array.isArray(records) || records.length === 0) {
            return fullResults;
        }

        searchTerm = String(searchTerm).toUpperCase().trim();

        let results = records.reduce((arr, color) => {
            if(sourceFilters.length > 0 && !sourceFilters.includes(color?.sourceId)) {
                return arr;
            }

            if (!searchTerm) {
                arr.push(color);
                return arr;
            }

            let addToList = false;
            let similarityPercentage = 0;
            for (let searchType of this.searchTypes) {
                switch (searchType) {
                    case "name":
                        similarityPercentage = this.levenshteinSimilarity(searchTerm, color?.name);
                        if ((String(color?.name).toUpperCase()).includes(searchTerm) || similarityPercentage >= 93) {
                            addToList = true;
                        }
                        break;
                    case "colorCode":
                        similarityPercentage = this.levenshteinSimilarity(searchTerm, color?.colorCode);
                        if ((String(color?.colorCode).toUpperCase()).includes(searchTerm) || similarityPercentage >= 93) {
                            addToList = true;
                        }
                        break;
                    case "hex":
                        if (searchTerm.length >= 3) {
                            let [isSimilar, colorSimilarityPercentage] = this.isColorSimilar(searchTerm, color.hex);
                            similarityPercentage = colorSimilarityPercentage;
                            if ((String(color?.hex).toUpperCase()).startsWith(searchTerm) || isSimilar) {
                                addToList = true;
                            }
                        }
                        break;
                    case "rgb":
                        if (searchTerm.length >= 3) {
                            let rgbParts = searchTerm.split(",");
                            let baseHex = this.rgbToHex((rgbParts[0] || 0), (rgbParts[1] || 0), (rgbParts[2] || 0))

                            let [isSimilar, colorSimilarityPercentage] = this.isColorSimilar(baseHex, color.hex);
                            similarityPercentage = colorSimilarityPercentage;
                            if ((String(color?.rgb).toUpperCase()).startsWith(searchTerm) || isSimilar) {
                                addToList = true;
                            }
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

                            let [isSimilar, colorSimilarityPercentage] = this.isColorSimilar(baseHex, color.hex);
                            similarityPercentage = colorSimilarityPercentage;
                            if ((String(color?.cmyk).toUpperCase()).startsWith(searchTerm) || isSimilar) {
                                addToList = true;
                            }
                        }
                        break;
                }

                if (addToList) {
                    arr.push({ ...color, similarity: similarityPercentage, matchedOn: searchType });
                    break;
                }
            }
            return arr;
        }, []);

        fullResults = fullResults.concat(results);
        return fullResults;
    },

    rgbToCmyk: function (r, g, b) {
        // Normalize RGB values to 0–1 range
        const rPrime = r / 255;
        const gPrime = g / 255;
        const bPrime = b / 255;

        // Calculate K (black key)
        const k = 1 - Math.max(rPrime, gPrime, bPrime);

        // Handle edge case for pure black
        if (k === 1) {
            return { c: 0, m: 0, y: 0, k: 1 };
        }

        // Calculate CMY values
        const c = (1 - rPrime - k) / (1 - k);
        const m = (1 - gPrime - k) / (1 - k);
        const y = (1 - bPrime - k) / (1 - k);

        // Return CMYK values rounded to two decimals
        return {
            c: parseFloat(c.toFixed(2)),
            m: parseFloat(m.toFixed(2)),
            y: parseFloat(y.toFixed(2)),
            k: parseFloat(k.toFixed(2)),
        };
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
        hex = String(hex).toUpperCase();
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
        a = a.replace(/\s+/g, '');  // Remove all whitespace characters
        b = b.replace(/\s+/g, '');  // Remove all whitespace characters
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
    levenshteinSimilarity: function (needle, haystack) {
        needle = String(needle).toUpperCase();
        haystack = String(haystack).toUpperCase();
        const maxLen = Math.max(needle.length, haystack.length);
        const distance = this.levenshtein(needle, haystack);
        let similarity = ((maxLen - distance) / maxLen) * 100; // Normalize to percentage

        // Apply a boost for small strings only if the match is already below 99% thereby leaving full matches without boost as the highest possible match
        if (needle.length <= this._levenshteinLengthThreshold && similarity < 99) {
            similarity = Math.min(similarity * this._levenshteinBoostFactor, 99); // Ensure it doesn't exceed 100%
        }

        return similarity;
    }

};

export default Utils;