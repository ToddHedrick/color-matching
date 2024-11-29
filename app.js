var pantone = {};
$(".thumbnail > .caption > p").each((i, elem) => {
    var breakdown = $(elem).text().split(/(HEX:|RGB:|CMYK:)/g);
    pantone[breakdown[0]] = {
        pantone: breakdown[0].trim(),
        hex: breakdown[2].trim(),
        rgb: breakdown[4].trim(),
        cmyk: breakdown[6].trim()
    };
})