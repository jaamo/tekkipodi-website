require("dotenv").config();

module.exports = function (eleventyConfig) {
  // Copy static assets
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");

  // Copy cookie consent library files
  eleventyConfig.addPassthroughCopy({
    "node_modules/vanilla-cookieconsent/dist/cookieconsent.css": "vendor/cookieconsent.css",
    "node_modules/vanilla-cookieconsent/dist/cookieconsent.umd.js": "vendor/cookieconsent.umd.js"
  });
  eleventyConfig.addPassthroughCopy("src/blog/**/*.jpg");
  eleventyConfig.addPassthroughCopy("src/blog/**/*.png");

  // Add global data for environment variables
  eleventyConfig.addGlobalData("env", {
    guestbookWidgetUrl:
      process.env.GUESTBOOK_WIDGET_URL ||
      "https://guestbook.tekkipodi.fi/widget.js",
  });

  // Add date filter
  eleventyConfig.addFilter("dateFormat", function (date, format) {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const shortMonths = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    if (format === "MMMM d, yyyy") {
      return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    } else if (format === "MMM d, yyyy") {
      return `${shortMonths[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    } else if (format === "iso") {
      return d.toISOString();
    }
    return d.toLocaleDateString();
  });

  // Convert length string (e.g. "26 min", "1h 23min") to ISO 8601 duration
  eleventyConfig.addFilter("lengthToISO8601", function (length) {
    if (!length) return "";
    const str = String(length).trim();
    const hourMatch = str.match(/(\d+)\s*h/);
    const minMatch = str.match(/(\d+)\s*min/);
    const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
    const minutes = minMatch ? parseInt(minMatch[1], 10) : 0;
    if (hours === 0 && minutes === 0) return "";
    let iso = "PT";
    if (hours > 0) iso += hours + "H";
    if (minutes > 0) iso += minutes + "M";
    return iso;
  });

  // Add collection for blog posts
  eleventyConfig.addCollection("blog", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/blog/*.md").sort((a, b) => {
      return b.date - a.date; // Sort by date, newest first
    });
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk", "html"],
  };
};
