/**
 * @version 1.0.1
 * @author Todd Hedrick
 * This class extends the out-of-the-box Javascript Date object to
 * provide an easy-to-use format function that uses most of
 * the same format options as PHP
 *
 */
class DateTime extends Date {
    static version = "1.0.1";

    static DATE_COOKIE = "l, d-M-Y H:i:s T"; // HTTP Cookies. Example: "Monday, 15-Aug-2005 15:52:01 UTC"
    static DATE_DB_DATETIME = "Y-m-d H:i:s"; // Standard database datetime format. Example: "2005-08-15 15:52:01"
    static DATE_DB_DATE = "Y-m-d"; // Standard database date format. Example: "2005-08-15"
    static DATE_DB_SQLITE = "Y-m-d H:i:s.v P"; // SQLite datetime format (example: 2005-08-15 15:52:01.000 +00:00)
    static DATE_RFC850 = "l, d-M-y H:i:s T"; // RFC 850. Example: "Monday, 15-Aug-05 15:52:01 UTC"
    static DATE_RFC1036 = "D, d M y H:i:s O"; // RFC 1036. Example: "Mon, 15 Aug 05 15:52:01 +0000"
    static DATE_RFC2822 = "D, d M Y H:i:s O"; // RFC 2822. Example: "Mon, 15 Aug 2005 15:52:01 +0000"
    static DATE_RFC7231 = "D, d M Y H:i:s \\G\\M\\T";  // RFC 7231. Example: "Sat, 30 Apr 2016 17:52:13 GMT"
    static DATE_RFC3339_EXTENDED = "Y-m-d\\TH:i:s.vP"; // RFC 3339 EXTENDED format. Example: "2005-08-15T15:52:01.000+00:00"
    static DATE_RFC3339_EXTENDED_O = "Y-m-d\\TH:i:s.vO"; // RFC 3339 EXTENDED format without the colon in the timezone offset. Example: "2005-08-15T15:52:01.000+0000"
    static DATE_RSS = "D, d M Y H:i:s O"; // RSS Example: "Mon, 15 Aug 2005 15:52:01 +0000"
    static DATE_W3C = "Y-m-d\\TH:i:sP"; // World Wide Web Consortium. Example: "2005-08-15T15:52:01+00:00"

    _timezone;

    /**
     *
     *
     */
    getTimeZone(){
        if(typeof this._timezone === "undefined"){
            if(typeof DateTimeZone === "function"){
                this._timezone = new DateTimeZone();
            } else {
                let offset = String(-1 * dateObj.getTimezoneOffset());
                let timezone_code = String(dateObj.toLocaleTimeString("en-US", {timeZoneName: "short"}).split(" ")[2]);
                if (offset === "0") {
                    timezone_code = "UTC";
                }
                this._timezone = {
                    "region": "",
                    "timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
                    "has_dst": false,
                    "location": {
                        "country_code": ""
                    },
                    "abbreviations": {}
                };
                this._timezone["abbreviations"][timezone_code] = {
                    "dst": false,
                    "offset": offset,
                }
            }
        }
    }

    /**
     *
     *
     */
    setTimeZone(datetimezone){
        if(typeof datetimezone === "string"){
            this._Timezone = new DateTimeZone(datetimezone);
        } else if(typeof datetimezone === "object" && datetimezone.constructor.name === "DateTimeZone"){
            this._timezone = datetimezone;
        } else {
            throw new Error("Invalid value provided. datetimezone must be a string or a DateTimeZone object");
        }
    }

    /**
     *
     * @param {Date} dateObj
     * @param {string} lang
     */
    _getTimeZoneCodeFromDate(dateObj, lang = "en-US") {
        let offset = String(-1 * dateObj.getTimezoneOffset());
        let timezone_code = String(dateObj.toLocaleTimeString("en-US", {timeZoneName: "short"}).split(" ")[2]);

        if (offset === "0") {
            timezone_code = "UTC";
        }

        return timezone_code;
    }

    /**
     * Returns an array of objects containing the month definitions used by JS Date class.
     * @returns {[{number: string, short_name: string, long_name: string}, ...]}
     * @private
     */
    _getMonthDefs() {
        return [
            {"number": "1", "short_name": "Jan", "long_name": "January"},
            {"number": "2", "short_name": "Feb", "long_name": "February"},
            {"number": "3", "short_name": "Mar", "long_name": "March"},
            {"number": "4", "short_name": "Apr", "long_name": "April"},
            {"number": "5", "short_name": "May", "long_name": "May"},
            {"number": "6", "short_name": "Jun", "long_name": "June"},
            {"number": "7", "short_name": "Jul", "long_name": "July"},
            {"number": "8", "short_name": "Aug", "long_name": "August"},
            {"number": "9", "short_name": "Sep", "long_name": "September"},
            {"number": "10", "short_name": "Oct", "long_name": "October"},
            {"number": "11", "short_name": "Nov", "long_name": "November"},
            {"number": "12", "short_name": "Dec", "long_name": "December"}
        ];
    }

    /**
     * Returns the day definitions used by JS Date
     * @returns {[{number: string, iso_8601_number: string, short_name: string, long_name: string}, ...]}
     * @private
     */
    _getDayDefs() {
        return [
            {"number": "0", "iso_8601_number": "7", "short_name": "Sun", "long_name": "Sunday"},
            {"number": "1", "iso_8601_number": "1", "short_name": "Mon", "long_name": "Monday"},
            {"number": "2", "iso_8601_number": "2", "short_name": "Tue", "long_name": "Tuesday"},
            {"number": "3", "iso_8601_number": "3", "short_name": "Wed", "long_name": "Wednesday"},
            {"number": "4", "iso_8601_number": "4", "short_name": "Thu", "long_name": "Thursday"},
            {"number": "5", "iso_8601_number": "5", "short_name": "Fri", "long_name": "Friday"},
            {"number": "6", "iso_8601_number": "6", "short_name": "Sat", "long_name": "Saturday"},
        ];
    }

    _getDateTimePieces(utc = false) {
        let full_year, month, date, day, hours, minutes, seconds, milliseconds;
        let timezone_offset, timezone_offset_sign, timezone_offset_hours, timezone_offset_minutes, timezone_code;

        if (utc) {
            full_year = this.getUTCFullYear();
            month = this.getUTCMonth();
            date = this.getUTCDate();
            day = this.getUTCDay();
            hours = this.getUTCHours();
            minutes = this.getUTCMinutes();
            seconds = this.getUTCSeconds();
            milliseconds = this.getUTCMilliseconds();
            timezone_offset = 0;
            timezone_code = "UTC";
        } else {
            full_year = this.getFullYear();
            month = this.getMonth();
            date = this.getDate();
            day = this.getDay();
            hours = this.getHours();
            minutes = this.getMinutes();
            seconds = this.getSeconds();
            milliseconds = this.getMilliseconds();
            timezone_offset = (-1 * this.getTimezoneOffset());
            timezone_code = this._getTimeZoneCodeFromDate(this);
        }

        timezone_offset_sign = (timezone_offset > 0) ? "-" : "+";
        timezone_offset_minutes = String(timezone_offset % 60).padStart(2, "0");
        timezone_offset_hours = String(Math.floor(timezone_offset / 60)).padStart(2, "0");

        return {
            "Y": String(full_year),
            "y": String(full_year).slice(-2),
            "F": this._getMonthDefs()[month].long_name,
            "M": this._getMonthDefs()[month].short_name,
            "m": this._getMonthDefs()[month].number.padStart(2, "0"),
            "n": this._getMonthDefs()[month].number,
            "d": String(date).padStart(2, "0"),
            "j": String(date),
            "D": this._getDayDefs()[day].short_name,
            "l": this._getDayDefs()[day].long_name,
            "N": this._getDayDefs()[day].iso_8601_number,
            "w": this._getDayDefs()[day].number,
            "a": (hours >= 12) ? "pm" : "am",
            "A": (hours >= 12) ? "PM" : "AM",
            "g": String((hours > 12) ? (hours - 12) : ((hours === 0) ? 12 : hours)),
            "h": String((hours > 12) ? (hours - 12) : ((hours === 0) ? 12 : hours)).padStart(2, "0"),
            "G": String(hours),
            "H": String(hours).padStart(2, "0"),
            "i": String(minutes).padStart(2, "0"),
            "s": String(seconds).padStart(2, "0"),
            "v": String(milliseconds).padStart(3, "0"),
            "e": timezone_code,
            "T": timezone_code,
            "O": timezone_offset_sign + timezone_offset_hours + timezone_offset_minutes,
            "P": timezone_offset_sign + timezone_offset_hours + ":" + timezone_offset_minutes,
            "p": (timezone_offset === 0) ? "Z" : (timezone_offset_sign + timezone_offset_hours + ":" + timezone_offset_minutes),
            "Z": String((timezone_offset * 60)),
            "U": Math.floor(this.getTime() / 1000),
        };
    }

    /**
     * Returns a new instance of DateTime by converting seconds
     * since epoch to milliseconds
     * @param {number} value
     * @param {string} noun - default is seconds
     * @returns {DateTime}
     */
    static createFromUnixTimeStamp(value, noun = "seconds") {
        if (typeof value === "undefined") {
            value = 0;
        }

        let unix_timestamp = value;
        switch (noun) {
            case "milliseconds":
                unix_timestamp = Number(value);
                break;
            case "seconds":
            default:
                unix_timestamp = Number(value) * 1000;
                break;
        }

        return new DateTime(unix_timestamp);
    }

    /**
     * @link https://www.php.net/manual/en/datetime.format.php
     * Returns a date object created from a date string based on the format provided (using the PHP style format options)
     * Popular formats:
     *    "Y-m-d H:i:s.v P" = "2023-10-17 10:50:30.000 -07:00"
     *    "Y-m-d H:i:s"     = "2023-10-17 17:37:08"
     *    "Y-m-d"           = "2023-10-17"
     *    "m/d/Y H:i:s"     = "10/17/2023 17:37:08"
     *    "m/d/Y"           = "10/17/2023"
     *    "m/d/Y g:i A"     = "10/17/2023 5:37 PM"
     * @param {string|number} date_str
     * @param {string} format
     * @returns {DateTime}
     */
    static createFromFormat(date_str, format) {
        date_str = String(date_str);
        let dateTime = new DateTime();
        let formatToRegex = {
            "Y": "([0-9]{4})",
            "y": "([0-9]{2})",
            "F": "(" + dateTime._getMonthDefs().map((month) => {
                return month.long_name;
            }).join("|") + ")",
            "M": "(" + dateTime._getMonthDefs().map((month) => {
                return month.short_name;
            }).join("|") + ")",
            "m": "(" + dateTime._getMonthDefs().map((month) => {
                return month.number.padStart(2, "0");
            }).join("|") + ")",
            "n": "(" + dateTime._getMonthDefs().map((month) => {
                return month.number;
            }).join("|") + ")",
            "d": "([0-2][0-9]|3[0-1])",
            "j": "([0-9]|[1-2][0-9]|3[0-1])",
            "D": "(" + dateTime._getDayDefs().map((day) => {
                return day.short_name;
            }).join("|") + ")",
            "l": "(" + dateTime._getDayDefs().map((day) => {
                return day.long_name;
            }).join("|") + ")",
            "N": "(" + dateTime._getDayDefs().map((day) => {
                return day.iso_8601_number;
            }).join("|") + ")",
            "w": "(" + dateTime._getDayDefs().map((day) => {
                return day.number;
            }).join("|") + ")",
            "a": "(am|pm)",
            "A": "(AM|PM)",
            "g": "([1-9]|1[0-2])",
            "h": "(0[1-9]|1[0-2])",
            "G": "([0-9]|1[0-9]|2[0-3])",
            "H": "(0[0-9]|1[0-9]|2[0-3])",
            "i": "([0-5][0-9])",
            "s": "([0-5][0-9])",
            "v": "([0-9]{3})",
            "e": "([A-Z]{3})",
            "T": "([A-Z]{3})",
            "O": "([+\-][0-9]{4})",
            "P": "([+\-][0-9]{2}:[0-9]{2})",
            "p": "([Z]|[+\-][0-9]{2}:[0-9]{2})",
            "U": "([0-9]{10})"
        };

        let match_arr = [];
        let regex_str = "";
        for (let i = 0; i < format.length; i++) {
            let char = format[i];
            let value = "";
            if (char === "\\") {
                i++;
                value = "\\" + format[i];
            } else if (char === "c") {
                // "Y-m-d\\TH:m:sP"
                match_arr.push("Y");
                match_arr.push("m");
                match_arr.push("d");
                match_arr.push("H");
                match_arr.push("m");
                match_arr.push("s");
                match_arr.push("P");
                value = formatToRegex["Y"] + "-" + formatToRegex["m"] + "-" + formatToRegex["d"] + "\\T" + formatToRegex["H"] + ":" + formatToRegex["m"] + ":" + formatToRegex["s"] + formatToRegex["P"];
            } else if (char === "r") {
                //"D, j M Y H:i:s O"
                match_arr.push("D");
                match_arr.push("j");
                match_arr.push("M");
                match_arr.push("Y");
                match_arr.push("H");
                match_arr.push("i");
                match_arr.push("s");
                match_arr.push("O");
                value = formatToRegex["D"] + "\, " + formatToRegex["j"] + " " + formatToRegex["M"] + " " + formatToRegex["Y"] + " " + formatToRegex["H"] + ":" + formatToRegex["m"] + ":" + formatToRegex["s"] + " " + formatToRegex["O"];
            } else if (char in formatToRegex) {
                match_arr.push(char);
                value = formatToRegex[char];
            } else {
                value = char;
            }
            regex_str += value;
        }

        if (!match_arr.includes("U") && !match_arr.includes("Y") && !match_arr.includes("y")) {
            throw new Error("Date format must include year");
        }

        if (!match_arr.includes("U") && !match_arr.includes("F") && !match_arr.includes("M") && !match_arr.includes("m") && !match_arr.includes("n")) {
            throw new Error("Date format must include month");
        }

        if (!match_arr.includes("U") && !match_arr.includes("d") && !match_arr.includes("j")) {
            throw new Error("Date format must include date of day");
        }

        let regex = new RegExp(regex_str);
        let date_pieces = date_str.match(regex);

        if (!date_pieces || ((date_pieces.length - 1) !== match_arr.length)) {
            throw new Error("Date format [" + format + "] does not match provided date string [" + date_str + "]");
        }

        let match_obj = {};
        for (let i = 0; i < match_arr.length; i++) {
            match_obj[match_arr[i]] = date_pieces[(i + 1)];
        }

        let new_date_str, year, month, date, hours, minutes, seconds, milliseconds, timezone_code, timezone_offset, unix_timestamp;
        if (match_obj.hasOwnProperty("U")) {
            let noun = "seconds";
            new_date_str = match_obj["U"];
            if (match_obj.hasOwnProperty("v")) {
                noun = "milliseconds";
                new_date_str += match_obj["v"];
            }
            return DateTime.createFromUnixTimeStamp(new_date_str, noun);
        } else {
            let slash_format = (match_obj.hasOwnProperty("y"));
            year = match_obj["Y"] || match_obj["y"] || "";

            if (match_obj.hasOwnProperty("m") || match_obj.hasOwnProperty("n")) {
                month = match_obj["m"] || match_obj["n"];
            } else if (match_obj.hasOwnProperty("F")) {
                let month_def = dateTime._getMonthDefs().find((month) => {
                    return month.long_name === match_obj["F"];
                });
                if (month_def) {
                    month = month_def.number.padStart(2, "0");
                } else {
                    throw new Error("Invalid month [" + match_obj["F"] + "] provided in date string [" + date_str + "]");
                }
            } else if (match_obj.hasOwnProperty("M")) {
                let month_def = dateTime._getMonthDefs().find((month) => {
                    return month.short_name === match_obj["M"];
                });
                if (month_def) {
                    month = month_def.number.padStart(2, "0");
                } else {
                    throw new Error("Invalid month [" + match_obj["M"] + "] provided in date string [" + date_str + "]");
                }
            }

            date = match_obj["d"] || match_obj["j"];
            hours = match_obj["h"] || match_obj["G"] || match_obj["H"] || "";
            minutes = match_obj["i"] || "";
            seconds = match_obj["s"] || "";
            milliseconds = match_obj["v"] || "";

            timezone_code = match_obj["e"] || match_obj["T"] || "";
            timezone_offset = match_obj["O"] || match_obj["P"] || match_obj["p"] || "";

            if (slash_format) {
                new_date_str = month + "/" + date + "/" + year;
            } else {
                new_date_str = year + "-" + month + "-" + date;
            }

            if (hours && minutes) {
                new_date_str += " " + hours + ":" + minutes;

                if (seconds) {
                    new_date_str += ":" + seconds;
                    if (milliseconds) {
                        new_date_str += "." + milliseconds;
                    }
                }
            } else {
                new_date_str += " 00:00:00";
            }

            if (timezone_offset) {
                new_date_str += " " + timezone_offset;
            } else if (timezone_code) {
                new_date_str += " " + timezone_code;
            }

            return new DateTime(new_date_str);
        }
    }

    /**
     * Allows you to modify the current date using an interval value
     *
     * @param {string} interval - a string containing the interval pattern of time you want to add.
     *                            Format is number followed by letter
     *                            Y = Years
     *                            M = Months
     *                            D = Days
     *                            T = Time - Values following the letter T will be considered as time, not date, values
     *                            H = Hours
     *                            M = Minutes
     *                            H = Hours
     *                            S = Seconds
     *                            V = Milliseconds
     *
     *                            Examples: 1DT1H5M15S = 1 Day Time 1 Hour 3 Minutes
     *                            Examples: 1Y-1D = 1 Year minus (-) 1 Day
     *                            Examples: 6MT5M = 6 Months and 5 Minutes
     *                            Examples: T12H30M = 12 Hours and 30 Minutes
     * @param {boolean} utc - defaults to true
     */
    modify(interval, utc = false) {
        let years, months, days, hours, minutes, seconds, milliseconds;
        let split_interval_pieces = interval.toUpperCase().split(/T/);
        let date_pieces = split_interval_pieces[0];
        if (date_pieces.length) {
            let date_parts = date_pieces.match(/([\+\-]{0,1}[0-9]+[YMD]{1})/g);
            for (let part of date_parts) {
                if (part.indexOf("Y") > 0 && typeof years === "undefined") {
                    years = Number(part.split(/Y/)[0]);
                    this.addYears(years, utc);
                }
                if (part.indexOf("M") > 0 && typeof months === "undefined") {
                    months = Number(part.split(/M/)[0]);
                    this.addMonths(months, utc);
                }
                if (part.indexOf("D") > 0 && typeof days === "undefined") {
                    days = Number(part.split(/D/)[0]);
                    this.addDays(days, utc);
                }
            }
        }

        if (split_interval_pieces.hasOwnProperty(1)) {
            let time_pieces = split_interval_pieces[1];
            if (time_pieces.length) {
                let time_parts = time_pieces.match(/([\+\-]{0,1}[0-9]+[HMS]{1})/g);
                for (let part of time_parts) {
                    if (part.indexOf("H") > 0 && typeof hours === "undefined") {
                        hours = Number(part.split(/H/)[0]);
                        this.addHours(hours, utc);
                    }
                    if (part.indexOf("M") > 0 && typeof minutes === "undefined") {
                        minutes = Number(part.split(/M/)[0]);
                        this.addMinutes(minutes, utc);
                    }
                    if (part.indexOf("S") > 0 && typeof seconds === "undefined") {
                        seconds = Number(part.split(/S/)[0]);
                        this.addSeconds(seconds, utc);
                    }
                    if (part.indexOf("V") > 0 && typeof milliseconds === "undefined") {
                        milliseconds = Number(part.split(/V/)[0]);
                        this.addMilliseconds(milliseconds, utc);
                    }
                }
            }
        }
        return this;
    }

    /**
     * Allows you to add OR subtract years from the current date
     * @param {Number|string} num - the number of years you want to add to the current time
     * @param {boolean} utc - defaults to true
     */
    addYears(num, utc = false) {
        if (typeof num === "number" && !isNaN(num)) {
            if (utc) {
                this.setUTCFullYear(this.getUTCFullYear() + num);
            } else {
                this.setFullYear(this.getFullYear() + num);
            }
        }
        return this;
    }

    /**
     * Allows you to add OR subtract months from the current date
     * @param {Number|string} num - the number of months you want to add to the current time
     * @param {boolean} utc - defaults to true
     */
    addMonths(num, utc = false) {
        if (typeof num === "number" && !isNaN(num)) {
            if (utc) {
                this.setUTCMonth(this.getUTCMonth() + num);
            } else {
                this.setMonth(this.getMonth() + num);
            }
        }
        return this;
    }

    /**
     * Allows you to add OR subtract days from the current date
     * @param {Number|string} num - the number of days you want to add to the current time
     * @param {boolean} utc - defaults to true
     */
    addDays(num, utc = false) {
        if (typeof num === "number" && !isNaN(num)) {
            if (utc) {
                this.setUTCDate(this.getUTCDate() + num);
            } else {
                this.setDate(this.getDate() + num);
            }
        }
        return this;
    }

    /**
     * Allows you to add OR subtract hours from the current date
     * @param {Number|string} num - the number of hours you want to add to the current time
     * @param {boolean} utc - defaults to true
     */
    addHours(num, utc = false) {
        if (typeof num === "number" && !isNaN(num)) {
            if (utc) {
                this.setUTCHours(this.getUTCHours() + num);
            } else {
                this.setHours(this.getHours() + num);
            }
        }
        return this;
    }

    /**
     * Allows you to add OR subtract minutes from the current date
     * @param {Number|string} num - the number of minutes you want to add to the current time
     * @param {boolean} utc - defaults to true
     */
    addMinutes(num, utc = false) {
        if (typeof num === "number" && !isNaN(num)) {
            if (utc) {
                this.setUTCMinutes(this.getUTCMinutes() + num);
            } else {
                this.setMinutes(this.getMinutes() + num);
            }
        }
        return this;
    }

    /**
     * Allows you to add OR subtract seconds from the current date
     * @param {Number|string} num - the number of seconds you want to add to the current time
     * @param {boolean} utc - defaults to true
     */
    addSeconds(num, utc = false) {
        if (typeof num === "number" && !isNaN(num)) {
            if (utc) {
                this.setUTCSeconds(this.getUTCSeconds() + num);
            } else {
                this.setSeconds(this.getSeconds() + num);
            }
        }
        return this;
    }

    /**
     * Allows you to add OR subtract milliseconds from the current date
     * @param {Number|string} num - the number of milliseconds you want to add to the current time
     * @param {boolean} utc - defaults to true
     */
    addMilliseconds(num, utc = false) {
        if (typeof num === "number" && !isNaN(num)) {
            if (utc) {
                this.setUTCMilliseconds(this.getUTCMilliseconds() + num);
            } else {
                this.setMilliseconds(this.getMilliseconds() + num);
            }
        }
        return this;
    }

    /**
     * @link https://www.php.net/manual/en/datetime.format.php
     * Returns the date string based on the format provided (using the PHP style format options)
     * Popular formats:
     *    "Y-m-d H:i:s.v P" = "2023-10-17 10:50:30.000 -07:00"
     *    "Y-m-d H:i:s"     = "2023-10-17 17:37:08"
     *    "Y-m-d"           = "2023-10-17"
     *    "m/d/Y H:i:s"     = "10/17/2023 17:37:08"
     *    "m/d/Y"           = "10/17/2023"
     *    "m/d/Y g:i A"     = "10/17/2023 5:37 PM"
     * @param {string} format
     * @param {boolean} utc
     * @returns {string}
     */
    format(format, utc = false) {
        let datePieces = this._getDateTimePieces(utc);
        let formatted_value = "";
        for (let i = 0; i < format.length; i++) {
            let char = format[i];
            let value = "";
            if (char === "\\") {
                i++;
                value = format[i];
            } else if (char === "c") {
                value = this.format("Y-m-d\\TH:m:sP", utc);
            } else if (char === "r") {
                value = this.format("D, j M Y H:i:s O", utc);
            } else if (char in datePieces) {
                value = datePieces[char];
            } else {
                value = char;
            }
            formatted_value += value;
        }

        return formatted_value;
    }
}

export default DateTime;