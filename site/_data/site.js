const production = process.env.NODE_ENV === "production"

const host = production ? process.env.SITE_HOST : "http://0.0.0.0:8080"

// For modifying the <base> tag
const baseurl = production ? "" : ""

module.exports = {
  name: "Digital Service at CMS",
  title: "Digital Service at CMS",
  description: "DSAC Webiste",
  type: "website",
  baseurl,
  url: `${host}${baseurl}`,
  domain: (host || "").replace("https://", ""),
  production,
  robots: production,
  locale: "en-US",
  nav: [{ url: "/about/", label: "About" }],
}
